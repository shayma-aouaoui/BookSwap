const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all books (with filters)
router.get('/', async (req, res) => {
  try {
    const { search, category, condition, status, location, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT b.*, u.full_name as giver_name, u.location as giver_location
      FROM books b
      JOIN users u ON b.giver_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (b.title ILIKE $${paramCount} OR b.author ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      query += ` AND b.category = $${paramCount}`;
      params.push(category);
    }

    if (condition) {
      paramCount++;
      query += ` AND b.condition = $${paramCount}`;
      params.push(condition);
    }

    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    } else {
      query += ` AND b.status = 'available'`;
    }

    if (location) {
      paramCount++;
      query += ` AND (b.location ILIKE $${paramCount} OR u.location ILIKE $${paramCount})`;
      params.push(`%${location}%`);
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.full_name as giver_name, u.location as giver_location, u.id as giver_id
       FROM books b
       JOIN users u ON b.giver_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create book
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const { title, author, category, condition, description, location } = req.body;

    if (!title || !author || !condition) {
      return res.status(400).json({ error: 'Title, author, and condition are required' });
    }

    // Handle uploaded images
    const image_urls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const result = await pool.query(
      `INSERT INTO books (giver_id, title, author, category, condition, description, location, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, title, author, category || null, condition, description || null, location || null, image_urls]
    );

    // Create activity
    await pool.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, entity_id)
       VALUES ($1, 'book_added', 'book', $2)`,
      [req.user.id, result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update book
router.put('/:id', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    // Verify ownership
    const bookCheck = await pool.query(
      'SELECT giver_id FROM books WHERE id = $1',
      [req.params.id]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (bookCheck.rows[0].giver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to update this book' });
    }

    const { title, author, category, condition, description, location, status, image_urls } = req.body;

    // Handle new uploaded images
    let finalImageUrls = image_urls ? JSON.parse(image_urls) : [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      finalImageUrls = [...finalImageUrls, ...newImages];
    }

    const result = await pool.query(
      `UPDATE books
       SET title = COALESCE($1, title),
           author = COALESCE($2, author),
           category = COALESCE($3, category),
           condition = COALESCE($4, condition),
           description = COALESCE($5, description),
           location = COALESCE($6, location),
           status = COALESCE($7, status),
           image_urls = COALESCE($8, image_urls)
       WHERE id = $9
       RETURNING *`,
      [title, author, category, condition, description, location, status, finalImageUrls, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete book
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Verify ownership
    const bookCheck = await pool.query(
      'SELECT giver_id FROM books WHERE id = $1',
      [req.params.id]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (bookCheck.rows[0].giver_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this book' });
    }

    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get books by user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE giver_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



