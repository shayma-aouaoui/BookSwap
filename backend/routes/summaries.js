const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get summaries for a book
router.get('/book/:bookId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bs.*, u.full_name as author_name
       FROM book_summaries bs
       JOIN users u ON bs.user_id = u.id
       WHERE bs.book_id = $1
       ORDER BY bs.created_at DESC`,
      [req.params.bookId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update summary
router.post('/', authenticate, async (req, res) => {
  try {
    const { book_id, title, summary, personal_insight, recommendation } = req.body;

    if (!book_id || !summary) {
      return res.status(400).json({ error: 'Book ID and summary are required' });
    }

    // Check if book exists
    const bookResult = await pool.query('SELECT id FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if summary already exists for this user and book
    const existingResult = await pool.query(
      'SELECT id FROM book_summaries WHERE book_id = $1 AND user_id = $2',
      [book_id, req.user.id]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing summary
      result = await pool.query(
        `UPDATE book_summaries
         SET title = COALESCE($1, title),
             summary = $2,
             personal_insight = COALESCE($3, personal_insight),
             recommendation = COALESCE($4, recommendation)
         WHERE book_id = $5 AND user_id = $6
         RETURNING *`,
        [title, summary, personal_insight, recommendation, book_id, req.user.id]
      );
    } else {
      // Create new summary
      result = await pool.query(
        `INSERT INTO book_summaries (book_id, user_id, title, summary, personal_insight, recommendation)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [book_id, req.user.id, title || null, summary, personal_insight || null, recommendation || null]
      );
    }

    // Get author name
    const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
    const summaryData = result.rows[0];
    summaryData.author_name = userResult.rows[0].full_name;

    res.status(existingResult.rows.length > 0 ? 200 : 201).json(summaryData);
  } catch (error) {
    console.error('Create/update summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete summary
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Verify ownership
    const summaryResult = await pool.query(
      'SELECT user_id FROM book_summaries WHERE id = $1',
      [req.params.id]
    );

    if (summaryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (summaryResult.rows[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this summary' });
    }

    await pool.query('DELETE FROM book_summaries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Summary deleted successfully' });
  } catch (error) {
    console.error('Delete summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



