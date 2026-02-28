const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config();

const app = express();

// --- Configuraciones iniciales ---
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'publico'
app.use(express.static(path.join(__dirname, 'publico')));

// --- Conexión a MariaDB (Aiven) ---
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 24498,
    connectionLimit: 5
});

// --- RUTAS DE LA API ---

// 1. Productos
app.get('/api/productos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM productos ORDER BY id DESC");
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

app.post('/api/productos', async (req, res) => {
    const { name, description, price, image, stock } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("INSERT INTO productos (nombre, descripcion, precio, imagen, stock) VALUES (?, ?, ?, ?, ?)", 
        [name, description, price, image, stock]);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM productos WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

// 2. Sugerencias
app.get('/api/sugerencias', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM sugerencias ORDER BY fecha DESC");
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

app.delete('/api/sugerencias/:id', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM sugerencias WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

// 3. Historia (Configuración)
app.get('/api/config', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT valor FROM configuracion WHERE clave = 'historia'");
        res.json(rows[0] || { valor: "Bienvenidos a HKAMYESTOR" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

app.put('/api/config', async (req, res) => {
    const { valor } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE configuracion SET valor = ? WHERE clave = 'historia'", [valor]);
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } finally { 
        if (conn) conn.release(); 
    }
});

// --- RUTAS DE NAVEGACIÓN (HTML) ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'publico', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'publico', 'admin.html'));
});

// Manejo de errores para rutas no encontradas (opcional)
app.use((req, res) => {
    res.status(404).send("Lo sentimos, no pudimos encontrar esa página.");
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en el puerto ${PORT}`);
});
