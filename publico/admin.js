/*
  admin.js - Panel administrativo conectado al servidor (Render + MariaDB)
*/

// CONFIG (Se mantiene el login local por ahora, pero los datos van al servidor)
const STORAGE_KEYS = {
    adminAuth: 'adminAuth',
    adminPassword: 'adminPassword'
};

// DOM
const tabs = {
    productos: document.getElementById('tab-productos'),
    sugerencias: document.getElementById('tab-sugerencias'),
    historia: document.getElementById('tab-historia'),
    login: document.getElementById('tab-login')
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTheme();
    initTabs();
    
    // Cargar datos desde el servidor
    renderProducts();
    renderSuggestionsForModeration();
    cargarHistoria();

    // Iniciar formularios
    initProductForm();
    initHistoryForm();
    initPasswordForm();
});

// ==================== AUTH ====================
function checkAuth() {
    const isAuth = localStorage.getItem(STORAGE_KEYS.adminAuth) === 'true';
    if (!isAuth) {
        window.location.href = 'login.html';
    }
}

// ==================== THEME ====================
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark');
    
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
}

// ==================== TABS ====================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            // Ocultar todos
            Object.values(tabs).forEach(t => t?.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            // Mostrar seleccionado
            tabs[tabName]?.classList.add('active');
            btn.classList.add('active');
        });
    });
}

// ==================== PRODUCTOS (SERVIDOR) ====================
async function renderProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    try {
        const res = await fetch('/api/productos');
        const products = await res.json();
        
        container.innerHTML = '';
        if (!products.length) {
            container.innerHTML = '<p class="empty-state">No hay productos registrados.</p>';
            return;
        }

        products.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div style="width:60px;flex-shrink:0">
                    <img src="${prod.imagen}" style="width:100%;height:60px;object-fit:cover;border-radius:5px">
                </div>
                <div class="admin-item-content" style="flex:1; margin-left:15px">
                    <div class="admin-item-title">${prod.nombre}</div>
                    <div class="admin-item-meta">$${Number(prod.precio).toLocaleString()} CLP • Stock: ${prod.stock}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-danger" onclick="deleteProduct(${prod.id})">🗑️ Eliminar</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) { console.error("Error cargando productos", err); }
}

function initProductForm() {
    const form = document.getElementById('product-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: document.getElementById('product-price').value,
            image: document.getElementById('product-image').value,
            stock: document.getElementById('product-stock').value
        };

        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (res.ok) {
            alert("✅ Producto agregado!");
            form.reset();
            renderProducts();
        }
    });
}

window.deleteProduct = async (id) => {
    if (confirm('¿Eliminar producto?')) {
        await fetch(`/api/productos/${id}`, { method: 'DELETE' });
        renderProducts();
    }
};

// ==================== SUGERENCIAS (SERVIDOR) ====================
async function renderSuggestionsForModeration() {
    const container = document.getElementById('moderacion-list');
    if (!container) return;

    try {
        const res = await fetch('/api/sugerencias');
        const suggestions = await res.json();
        
        container.innerHTML = '';
        if (!suggestions.length) {
            container.innerHTML = '<p class="empty-state">No hay sugerencias.</p>';
            return;
        }

        suggestions.forEach(sug => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div class="admin-item-content" style="flex:1">
                    <div class="admin-item-title">${sug.titulo || 'Sin título'}</div>
                    <div class="admin-item-meta">${sug.nombre} • ${new Date(sug.fecha).toLocaleDateString()}</div>
                    <div class="admin-item-desc">${sug.mensaje}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-danger" onclick="deleteSuggestion(${sug.id})">🗑️ Eliminar</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) { console.error("Error en sugerencias", err); }
}

window.deleteSuggestion = async (id) => {
    if (confirm('¿Eliminar sugerencia?')) {
        await fetch(`/api/sugerencias/${id}`, { method: 'DELETE' });
        renderSuggestionsForModeration();
    }
};

// ==================== HISTORIA (SERVIDOR) ====================
async function cargarHistoria() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        const textarea = document.getElementById('historia-texto');
        if (textarea) textarea.value = data.valor || '';
    } catch (err) { console.error("Error historia", err); }
}

function initHistoryForm() {
    document.getElementById('historia-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const valor = document.getElementById('historia-texto').value;
        const res = await fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor })
        });
        if (res.ok) alert('✅ Historia actualizada');
    });
}

// ==================== PASSWORD ====================
function initPasswordForm() {
    document.getElementById('password-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Función de cambio de contraseña activada localmente.");
    });
}
