const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get user's reading lists
router.get('/me', authenticate, async (req, res) => {
  try {
    const { list_type } = req.query;
    let query = `
      SELECT rl.*, b.*, u.full_name as giver_name
      FROM reading_lists rl
      JOIN books b ON rl.book_id = b.id
      JOIN users u ON b.giver_id = u.id
      WHERE rl.user_id = $1
    `;
    const params = [req.user.id];

    if (list_type) {
      query += ' AND rl.list_type = $2';
      params.push(list_type);
    }

    query += ' ORDER BY rl.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reading lists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add book to reading list
router.post('/', authenticate, async (req, res) => {
  try {
    const { book_id, list_type = 'reading' } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    if (!['reading', 'wishlist', 'completed'].includes(list_type)) {
      return res.status(400).json({ error: 'Invalid list type' });
    }

    // Check if book exists
    const bookResult = await pool.query('SELECT id FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if already in list
    const existingResult = await pool.query(
      'SELECT id FROM reading_lists WHERE user_id = $1 AND book_id = $2 AND list_type = $3',
      [req.user.id, book_id, list_type]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Book already in this list' });
    }

    const result = await pool.query(
      `INSERT INTO reading_lists (user_id, book_id, list_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, book_id, list_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add to reading list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove book from reading list
router.delete('/:bookId', authenticate, async (req, res) => {
  try {
    const { list_type } = req.query;

    let query = 'DELETE FROM reading_lists WHERE user_id = $1 AND book_id = $2';
    const params = [req.user.id, req.params.bookId];

    if (list_type) {
      query += ' AND list_type = $3';
      params.push(list_type);
    }

    await pool.query(query, params);
    res.json({ message: 'Book removed from list' });
  } catch (error) {
    console.error('Remove from reading list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



