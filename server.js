const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'publico')));

// --- Conexión a MariaDB ---
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 24498,
    connectionLimit: 5
});

// --- FUNCIÓN MÁGICA: Crea las tablas automáticamente ---
async function inicializarBaseDe Datos() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("✅ Conectado a Aiven. Verificando tablas...");
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                precio INT NOT NULL,
                imagen TEXT,
                stock INT DEFAULT 1
            )
        `);
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave VARCHAR(50) PRIMARY KEY,
                valor TEXT
            )
        `);

        // Insertar historia inicial si no existe
        const res = await conn.query("SELECT * FROM configuracion WHERE clave = 'historia'");
        if (res.length === 0) {
            await conn.query("INSERT INTO configuracion (clave, valor) VALUES ('historia', 'Bienvenidos a HKAMYESTOR')");
        }
        
        console.log("🚀 Tablas listas para usar.");
    } catch (err) {
        console.error("❌ Error inicializando base de datos:", err);
    } finally {
        if (conn) conn.release();
    }
}

// Ejecutar la inicialización
inicializarBaseDe Datos();

// --- RUTAS DE LA API ---

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

app.get('/api/config', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT valor FROM configuracion WHERE clave = 'historia'");
        res.json(rows[0] || { valor: "Nuestra historia..." });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
});

// --- RUTAS HTML ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'publico', 'admin.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
