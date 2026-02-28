const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'publico')));

// --- CONFIGURACIÓN REFORZADA PARA AIVEN ---
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 24498,
    connectionLimit: 5,
    // Agregamos SSL y más tiempo de espera para evitar el Timeout
    connectTimeout: 20000,
    ssl: { rejectUnauthorized: false } 
});

async function inicializarBD() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("✅ Conexión con Aiven exitosa (con SSL)");
        
        await conn.query(`CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            precio INT NOT NULL,
            imagen TEXT,
            stock INT DEFAULT 1
        )`);
        
        await conn.query(`CREATE TABLE IF NOT EXISTS configuracion (
            clave VARCHAR(50) PRIMARY KEY,
            valor TEXT
        )`);

        const res = await conn.query("SELECT * FROM configuracion WHERE clave = 'historia'");
        if (res.length === 0) {
            await conn.query("INSERT INTO configuracion (clave, valor) VALUES ('historia', 'Bienvenidos a HKAMYESTOR')");
        }
        console.log("🚀 Tablas verificadas y listas");
    } catch (err) {
        console.error("❌ Error en BD:", err.message);
    } finally {
        if (conn) conn.release();
    }
}

inicializarBD();

app.get('/api/productos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM productos ORDER BY id DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
});

app.post('/api/productos', async (req, res) => {
    const { name, description, price, image, stock } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("INSERT INTO productos (nombre, descripcion, precio, imagen, stock) VALUES (?, ?, ?, ?, ?)", 
        [name, description, price, image, stock]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'admin.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
