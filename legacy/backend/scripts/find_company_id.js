require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function main() {
  try {
    const email = 'test@test.com';
    const result = await pool.query('SELECT company_id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('No user found with email:', email);
    } else {
      console.log('company_id for', email, ':', result.rows[0].company_id);
    }
  } catch (err) {
    console.error('Error querying company_id:', err);
  } finally {
    await pool.end();
  }
}

main();
