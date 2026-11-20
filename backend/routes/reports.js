const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Create report
router.post('/', authenticate, async (req, res) => {
  try {
    const { reported_user_id, reported_book_id, report_type, description } = req.body;

    if (!report_type || !description) {
      return res.status(400).json({ error: 'Report type and description are required' });
    }

    if (!reported_user_id && !reported_book_id) {
      return res.status(400).json({ error: 'Must report either a user or a book' });
    }

    // Verify reported entities exist
    if (reported_user_id) {
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [reported_user_id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Reported user not found' });
      }
    }

    if (reported_book_id) {
      const bookResult = await pool.query('SELECT id FROM books WHERE id = $1', [reported_book_id]);
      if (bookResult.rows.length === 0) {
        return res.status(404).json({ error: 'Reported book not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reported_book_id, report_type, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, reported_user_id || null, reported_book_id || null, report_type, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



