require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../../../../database/seeds/001_master_data.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Seed complete.');
  } catch (e) { console.error('Seed failed:', e.message); }
  await pool.end();
})();
