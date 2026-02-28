const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'publico')));

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 24498,
    connectionLimit: 5,
    connectTimeout: 20000,
    ssl: { rejectUnauthorized: false } 
});

async function inicializarBD() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("✅ Conexión con Aiven exitosa (con SSL)");
        
        // Tabla de Productos
        await conn.query(`CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            precio INT NOT NULL,
            imagen TEXT,
            stock INT DEFAULT 1
        )`);
        
        // NUEVA: Tabla de Sugerencias (Para que aparezcan en el Admin)
        await conn.query(`CREATE TABLE IF NOT EXISTS sugerencias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255),
            titulo VARCHAR(255),
            mensaje TEXT,
            importancia INT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await conn.query(`CREATE TABLE IF NOT EXISTS configuracion (
            clave VARCHAR(50) PRIMARY KEY,
            valor TEXT
        )`);

        const res = await conn.query("SELECT * FROM configuracion WHERE clave = 'historia'");
        if (res.length === 0) {
            await conn.query("INSERT INTO configuracion (clave, valor) VALUES ('historia', 'Bienvenidos a HKAMYESTOR')");
        }
        console.log("🚀 Todas las tablas listas (incluyendo sugerencias)");
    } catch (err) {
        console.error("❌ Error en BD:", err.message);
    } finally {
        if (conn) conn.release();
    }
}

inicializarBD();

// --- RUTAS DE PRODUCTOS ---
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

// --- NUEVAS: RUTAS DE SUGERENCIAS (Para que se sincronicen) ---
app.get('/api/sugerencias', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM sugerencias ORDER BY fecha DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
});

app.post('/api/sugerencias', async (req, res) => {
    const { nombre, titulo, mensaje, importancia } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("INSERT INTO sugerencias (nombre, titulo, mensaje, importancia) VALUES (?, ?, ?, ?)", 
        [nombre, titulo, mensaje, importancia]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
});

// --- RUTAS DE PÁGINAS ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'admin.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
