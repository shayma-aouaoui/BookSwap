const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get activity feed
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT a.*, u.full_name as user_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.activity_type = 'book_added'
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Enrich with book details
    const activities = await Promise.all(
      result.rows.map(async (activity) => {
        if (activity.entity_type === 'book') {
          const bookResult = await pool.query(
            'SELECT id, title, author, image_urls, category FROM books WHERE id = $1',
            [activity.entity_id]
          );
          activity.book = bookResult.rows[0] || null;
        }
        return activity;
      })
    );

    res.json(activities);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



