const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get messages for a request
router.get('/request/:requestId', authenticate, async (req, res) => {
  try {
    // Verify user is part of this request
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
    if (request.giver_id !== req.user.id && request.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view these messages' });
    }

    const result = await pool.query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.request_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.requestId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', authenticate, async (req, res) => {
  try {
    const { request_id, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is part of this request
    const requestResult = await pool.query(
      `SELECT br.*, b.giver_id
       FROM book_requests br
       JOIN books b ON br.book_id = b.id
       WHERE br.id = $1`,
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];
    if (request.giver_id !== req.user.id && request.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to send messages for this request' });
    }

    const result = await pool.query(
      `INSERT INTO messages (request_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [request_id, req.user.id, content.trim()]
    );

    // Get sender name
    const senderResult = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [req.user.id]
    );

    const message = result.rows[0];
    message.sender_name = senderResult.rows[0].full_name;

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
router.put('/request/:requestId/read', authenticate, async (req, res) => {
  try {
    // Verify user is part of this request
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
    if (request.giver_id !== req.user.id && request.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark all messages from other users as read
    await pool.query(
      `UPDATE messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE request_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [req.params.requestId, req.user.id]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



