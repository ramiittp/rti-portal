require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../../../../database/migrations/001_initial_schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Migration complete.');
  } catch (e) { console.error('Migration failed:', e.message); }
  await pool.end();
})();
