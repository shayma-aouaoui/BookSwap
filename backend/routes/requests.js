const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { calculateDueDate, DEFAULT_LOAN_DURATION_DAYS } = require('../utils/penaltyCalculator');

// Create book request
router.post('/', authenticate, async (req, res) => {
  try {
    const { book_id, message } = req.body;

    // Check if book exists and is available
    const bookResult = await pool.query(
      'SELECT id, giver_id, status FROM books WHERE id = $1',
      [book_id]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = bookResult.rows[0];

    if (book.giver_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot request your own book' });
    }

    if (book.status !== 'available') {
      return res.status(400).json({ error: 'Book is not available' });
    }

    // Check for existing pending request
    const existingRequest = await pool.query(
      'SELECT id FROM book_requests WHERE book_id = $1 AND receiver_id = $2 AND status = $3',
      [book_id, req.user.id, 'pending']
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending request for this book' });
    }

    // Create request
    const result = await pool.query(
      `INSERT INTO book_requests (book_id, receiver_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [book_id, req.user.id, message || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get requests for a user's books (as giver)
router.get('/my-books', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, b.image_urls,
              u.full_name as receiver_name, u.location as receiver_location
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON br.receiver_id = u.id
       WHERE b.giver_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    
    // Add penalty info for each request
    const { getPenaltyInfo } = require('../utils/penaltyCalculator');
    const requestsWithPenalty = result.rows.map(request => ({
      ...request,
      penaltyInfo: getPenaltyInfo(request)
    }));
    
    res.json(requestsWithPenalty);
  } catch (error) {
    console.error('Get my book requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's requests (as receiver)
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, b.image_urls, b.status as book_status,
              u.full_name as giver_name, u.location as giver_location
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON b.giver_id = u.id
       WHERE br.receiver_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    
    // Add penalty info for each request
    const { getPenaltyInfo } = require('../utils/penaltyCalculator');
    const requestsWithPenalty = result.rows.map(request => ({
      ...request,
      penaltyInfo: getPenaltyInfo(request)
    }));
    
    res.json(requestsWithPenalty);
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept or reject request
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    // Verify ownership of the book
    const requestResult = await pool.query(
      `SELECT br.*, b.giver_id
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1`,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.giver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to modify this request' });
    }

    // Update request status
    const result = await pool.query(
      `UPDATE book_requests
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    // If accepted, mark book as reserved, set borrow date and due date, reject other pending requests
    if (status === 'accepted') {
      const borrowedAt = new Date();
      const dueDate = calculateDueDate(borrowedAt, DEFAULT_LOAN_DURATION_DAYS);
      
      await pool.query(
        `UPDATE book_requests
         SET borrowed_at = $1, due_date = $2, return_duration_days = $3
         WHERE id = $4`,
        [borrowedAt, dueDate, DEFAULT_LOAN_DURATION_DAYS, req.params.id]
      );

      await pool.query(
        'UPDATE books SET status = $1 WHERE id = $2',
        ['reserved', request.book_id]
      );

      await pool.query(
        `UPDATE book_requests
         SET status = 'rejected'
         WHERE book_id = $1 AND id != $2 AND status = 'pending'`,
        [request.book_id, req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark request as completed (book exchanged)
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    // Verify ownership
    const requestResult = await pool.query(
      `SELECT br.*, b.giver_id
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1`,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.giver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update request and book status
    await pool.query(
      'UPDATE book_requests SET status = $1 WHERE id = $2',
      ['completed', req.params.id]
    );

    await pool.query(
      'UPDATE books SET status = $1 WHERE id = $2',
      ['exchanged', request.book_id]
    );

    res.json({ message: 'Request marked as completed' });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark book as returned
router.put('/:id/return', authenticate, async (req, res) => {
  try {
    // Verify ownership (giver can mark as returned)
    const requestResult = await pool.query(
      `SELECT br.*, b.giver_id
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1`,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.giver_id !== req.user.id && request.receiver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'accepted' && request.status !== 'completed') {
      return res.status(400).json({ error: 'Book must be accepted before it can be returned' });
    }

    const returnedAt = new Date();

    // Update request status and return date
    await pool.query(
      `UPDATE book_requests 
       SET status = 'returned', returned_at = $1
       WHERE id = $2`,
      [returnedAt, req.params.id]
    );

    // Mark book as available again
    await pool.query(
      'UPDATE books SET status = $1 WHERE id = $2',
      ['available', request.book_id]
    );

    res.json({ message: 'Book marked as returned' });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


