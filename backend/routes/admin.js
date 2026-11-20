const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get all reports
router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*,
             u1.full_name as reporter_name,
             u2.full_name as reported_user_name,
             b.title as reported_book_title
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.reported_user_id = u2.id
      LEFT JOIN books b ON r.reported_book_id = b.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update report status
router.put('/reports/:id', async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE reports
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           resolved_at = CASE WHEN $1 IN ('resolved', 'dismissed') THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics (basic stats)
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalBooks,
      totalRequests,
      totalExchanges,
      booksByCategory,
      booksByCondition
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM books'),
      pool.query('SELECT COUNT(*) as count FROM book_requests'),
      pool.query("SELECT COUNT(*) as count FROM book_requests WHERE status = 'completed'"),
      pool.query(`
        SELECT category, COUNT(*) as count
        FROM books
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT condition, COUNT(*) as count
        FROM books
        GROUP BY condition
        ORDER BY count DESC
      `)
    ]);

    res.json({
      total_users: parseInt(totalUsers.rows[0].count),
      total_books: parseInt(totalBooks.rows[0].count),
      total_requests: parseInt(totalRequests.rows[0].count),
      total_exchanges: parseInt(totalExchanges.rows[0].count),
      books_by_category: booksByCategory.rows,
      books_by_condition: booksByCondition.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



