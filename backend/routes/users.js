const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, user_type, location, interests, bio, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's rating average
    const ratingResult = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
       FROM ratings WHERE to_user_id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    user.avg_rating = ratingResult.rows[0].avg_rating || 0;
    user.rating_count = parseInt(ratingResult.rows[0].rating_count) || 0;

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, user_type, location, interests, bio, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's rating average
    const ratingResult = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
       FROM ratings WHERE to_user_id = $1`,
      [req.params.id]
    );

    const user = result.rows[0];
    user.avg_rating = ratingResult.rows[0].avg_rating || 0;
    user.rating_count = parseInt(ratingResult.rows[0].rating_count) || 0;

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { full_name, location, interests, bio } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           location = COALESCE($2, location),
           interests = COALESCE($3, interests),
           bio = COALESCE($4, bio)
       WHERE id = $5
       RETURNING id, email, full_name, user_type, location, interests, bio, updated_at`,
      [full_name, location, interests, bio, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



