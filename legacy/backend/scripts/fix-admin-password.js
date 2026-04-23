const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAdminPassword() {
  try {
    const hash = await bcrypt.hash('admin123', 12);
    console.log('Generated hash:', hash);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, 'admin@persona.local']
    );
    
    console.log('Updated rows:', result.rowCount);
    
    // Verify
    const verify = await pool.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      ['admin@persona.local']
    );
    
    if (verify.rows[0]) {
      const isValid = await bcrypt.compare('admin123', verify.rows[0].password_hash);
      console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();
