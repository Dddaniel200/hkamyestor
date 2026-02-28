const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
require('dotenv').config();

const app = express();

// Configuraciones iniciales
app.use(cors());
app.use(express.json());
app.use(express.static('../public')); 

// Conexión a MariaDB
const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hkamyestor',
    connectionLimit: 5
});

// 1. RUTA DE PRUEBA (Para ver en el navegador)
app.get('/api/test', (req, res) => {
    res.json({ message: "API Conectada y funcionando" });
});

// 2. RUTA PARA GUARDAR (POST)
app.post('/api/sugerencias', async (req, res) => {
    console.log("📩 Intento de guardado recibido:", req.body);
    let conn;
    try {
        const { name, message, title, rating } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: "Faltan datos (nombre o mensaje)" });
        }

        conn = await pool.getConnection();
        const query = "INSERT INTO sugerencias (nombre, mensaje, titulo, rating) VALUES (?, ?, ?, ?)";
        await conn.query(query, [name, message, title || null, typeof rating !== 'undefined' ? rating : null]);

        console.log("✅ Guardado exitoso en MariaDB (con titulo/rating si presentes)");
        res.json({ success: true, message: "Sugerencia guardada correctamente" });
    } catch (err) {
        console.error("❌ Error en la base de datos:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// 3. RUTA PARA LEER (GET)
app.get('/api/sugerencias', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, nombre, mensaje, titulo, rating, fecha FROM sugerencias ORDER BY fecha DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
    console.log(`📊 Conectado a la base de datos: hkamyestor`);
});