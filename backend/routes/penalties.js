const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');
const { calculateDaysOverdue, calculatePenaltyAmount, getPenaltyInfo } = require('../utils/penaltyCalculator');

// Get penalties for current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT p.*, br.book_id, b.title as book_title, b.author as book_author
      FROM penalties p
      JOIN book_requests br ON p.request_id = br.id
      JOIN books b ON br.book_id = b.id
      WHERE p.user_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND p.status = $2';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get penalties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get overdue books and calculate penalties
router.get('/check-overdue', authenticate, async (req, res) => {
  try {
    // Get all accepted requests that are overdue
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, u.full_name as giver_name
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON b.giver_id = u.id
       WHERE br.receiver_id = $1 
         AND br.status = 'accepted'
         AND br.due_date IS NOT NULL
         AND br.due_date < CURRENT_TIMESTAMP
         AND br.returned_at IS NULL`,
      [req.user.id]
    );

    const overdueBooks = result.rows.map(request => {
      const penaltyInfo = getPenaltyInfo(request);
      return {
        ...request,
        penaltyInfo
      };
    });

    res.json(overdueBooks);
  } catch (error) {
    console.error('Check overdue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate and create penalty for an overdue book
router.post('/calculate/:requestId', authenticate, async (req, res) => {
  try {
    // Get the request
    const requestResult = await pool.query(
      `SELECT br.*, b.giver_id
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1`,
      [req.params.requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Only receiver can have penalties calculated
    if (request.receiver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!request.due_date || request.returned_at) {
      return res.status(400).json({ error: 'Book is not overdue or has been returned' });
    }

    const penaltyInfo = getPenaltyInfo(request);

    if (!penaltyInfo.isOverdue) {
      return res.status(400).json({ error: 'Book is not overdue' });
    }

    // Check if penalty already exists
    const existingPenalty = await pool.query(
      `SELECT id FROM penalties 
       WHERE request_id = $1 AND status = 'pending'`,
      [req.params.requestId]
    );

    if (existingPenalty.rows.length > 0) {
      return res.status(400).json({ error: 'Penalty already calculated for this request' });
    }

    // Create penalty
    const penaltyResult = await pool.query(
      `INSERT INTO penalties (request_id, user_id, penalty_amount, penalty_type, days_overdue, description)
       VALUES ($1, $2, $3, 'overdue', $4, $5)
       RETURNING *`,
      [
        req.params.requestId,
        request.receiver_id,
        penaltyInfo.penaltyAmount,
        penaltyInfo.daysOverdue,
        `Overdue penalty for ${penaltyInfo.daysOverdue} days`
      ]
    );

    // Update user's total penalty amount
    await pool.query(
      `UPDATE users 
       SET total_penalty_amount = total_penalty_amount + $1
       WHERE id = $2`,
      [penaltyInfo.penaltyAmount, request.receiver_id]
    );

    res.status(201).json(penaltyResult.rows[0]);
  } catch (error) {
    console.error('Calculate penalty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pay penalty
router.put('/:id/pay', authenticate, async (req, res) => {
  try {
    // Get penalty
    const penaltyResult = await pool.query(
      'SELECT * FROM penalties WHERE id = $1',
      [req.params.id]
    );

    if (penaltyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Penalty not found' });
    }

    const penalty = penaltyResult.rows[0];

    if (penalty.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (penalty.status !== 'pending') {
      return res.status(400).json({ error: 'Penalty is already paid, waived, or cancelled' });
    }

    // Update penalty status
    await pool.query(
      `UPDATE penalties 
       SET status = 'paid', paid_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.params.id]
    );

    // Update user's total penalties paid
    await pool.query(
      `UPDATE users 
       SET total_penalties_paid = total_penalties_paid + $1,
           total_penalty_amount = GREATEST(0, total_penalty_amount - $1)
       WHERE id = $2`,
      [penalty.penalty_amount, penalty.user_id]
    );

    res.json({ message: 'Penalty paid successfully' });
  } catch (error) {
    console.error('Pay penalty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Waive penalty
router.put('/:id/waive', authenticate, isAdmin, async (req, res) => {
  try {
    const penaltyResult = await pool.query(
      'SELECT * FROM penalties WHERE id = $1',
      [req.params.id]
    );

    if (penaltyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Penalty not found' });
    }

    const penalty = penaltyResult.rows[0];

    if (penalty.status !== 'pending') {
      return res.status(400).json({ error: 'Penalty is not pending' });
    }

    // Update penalty status
    await pool.query(
      `UPDATE penalties 
       SET status = 'waived'
       WHERE id = $1`,
      [req.params.id]
    );

    // Update user's total penalty amount
    await pool.query(
      `UPDATE users 
       SET total_penalty_amount = GREATEST(0, total_penalty_amount - $1)
       WHERE id = $2`,
      [penalty.penalty_amount, penalty.user_id]
    );

    res.json({ message: 'Penalty waived successfully' });
  } catch (error) {
    console.error('Waive penalty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's penalty summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT total_penalty_amount, total_penalties_paid 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const pendingPenalties = await pool.query(
      `SELECT SUM(penalty_amount) as total
       FROM penalties
       WHERE user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );

    res.json({
      total_penalty_amount: parseFloat(userResult.rows[0].total_penalty_amount || 0),
      total_penalties_paid: parseFloat(userResult.rows[0].total_penalties_paid || 0),
      pending_penalty_amount: parseFloat(pendingPenalties.rows[0].total || 0)
    });
  } catch (error) {
    console.error('Get penalty summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


