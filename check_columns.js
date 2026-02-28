require('dotenv').config();
const mariadb = require('mariadb');

(async () => {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hkamyestor',
    connectionLimit: 5,
  });

  let conn;
  try {
    conn = await pool.getConnection();
    const cols = await conn.query("SHOW COLUMNS FROM sugerencias");
    console.log('COLUMNS:', JSON.stringify(cols, null, 2));
  } catch (err) {
    console.error('DB error:', err);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
})();
