const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Read SQL schema file
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    console.log('Database schema created successfully!');

    // Optionally seed with initial data
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();



