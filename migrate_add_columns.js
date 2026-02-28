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
    console.log('Conectado a la base de datos, revisando columnas...');

    const checkTitulo = await conn.query("SHOW COLUMNS FROM sugerencias LIKE 'titulo'");
    if (!checkTitulo || checkTitulo.length === 0) {
      console.log('Añadiendo columna `titulo`...');
      await conn.query('ALTER TABLE sugerencias ADD COLUMN titulo VARCHAR(255) NULL');
      console.log('Columna `titulo` añadida.');
    } else {
      console.log('Columna `titulo` ya existe.');
    }

    const checkRating = await conn.query("SHOW COLUMNS FROM sugerencias LIKE 'rating'");
    if (!checkRating || checkRating.length === 0) {
      console.log('Añadiendo columna `rating`...');
      await conn.query('ALTER TABLE sugerencias ADD COLUMN rating TINYINT NULL DEFAULT 0');
      console.log('Columna `rating` añadida.');
    } else {
      console.log('Columna `rating` ya existe.');
    }

    console.log('Migración completada.');
  } catch (err) {
    console.error('Error en migración:', err);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
})();
