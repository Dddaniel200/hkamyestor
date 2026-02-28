const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config();

const app = express();

// --- Configuraciones iniciales ---
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'publico')));

// 2. Ruta con diagnóstico
app.get('/', (req, res) => {
    const fs = require('fs');
    const pathIndex = path.join(__dirname, 'publico', 'index.html');
    
    if (fs.existsSync(pathIndex)) {
        res.sendFile(pathIndex);
    } else {
        // Si no lo encuentra, nos dirá qué archivos hay realmente
        const archivos = fs.readdirSync(__dirname);
        res.status(404).send(`Archivo no encontrado. En la raíz hay: ${archivos.join(', ')}`);
    }
});

// --- Conexión a MariaDB ---
const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hkamyestor',
    connectionLimit: 5
});

// --- Rutas de la API ---

// 1. RUTA DE PRUEBA
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

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en el puerto ${PORT}`);
});


