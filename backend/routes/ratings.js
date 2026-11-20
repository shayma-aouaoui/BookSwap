const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as from_user_name, b.title as book_title
       FROM ratings r
       JOIN users u ON r.from_user_id = u.id
       LEFT JOIN books b ON r.book_id = b.id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update rating
router.post('/', authenticate, async (req, res) => {
  try {
    const { to_user_id, book_id, rating, feedback } = req.body;

    if (!to_user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid to_user_id and rating (1-5) are required' });
    }

    if (to_user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot rate yourself' });
    }

    // Check if rating already exists
    const existingResult = await pool.query(
      'SELECT id FROM ratings WHERE from_user_id = $1 AND to_user_id = $2 AND book_id = COALESCE($3, book_id)',
      [req.user.id, to_user_id, book_id || null]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing rating
      result = await pool.query(
        `UPDATE ratings
         SET rating = $1, feedback = COALESCE($2, feedback)
         WHERE id = $3
         RETURNING *`,
        [rating, feedback, existingResult.rows[0].id]
      );
    } else {
      // Create new rating
      result = await pool.query(
        `INSERT INTO ratings (from_user_id, to_user_id, book_id, rating, feedback)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, to_user_id, book_id || null, rating, feedback || null]
      );
    }

    // Get from_user_name
    const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
    const ratingData = result.rows[0];
    ratingData.from_user_name = userResult.rows[0].full_name;

    res.status(existingResult.rows.length > 0 ? 200 : 201).json(ratingData);
  } catch (error) {
    console.error('Create/update rating error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



