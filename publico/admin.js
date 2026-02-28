/*
  admin.js - panel administrativo completo
  Gestionar productos, moderar sugerencias, cambiar contraseña
*/

// CONFIG
const ADMIN_PASSWORD = 'admin123';
const STORAGE_KEYS = {
    adminAuth: 'adminAuth',
    products: 'products',
    suggestions: 'suggestions',
    adminPassword: 'adminPassword'
};

// DOM
const tabs = {
    productos: document.getElementById('tab-productos'),
    sugerencias: document.getElementById('tab-sugerencias'),
    login: document.getElementById('tab-login')
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTheme();
    initTabs();
    initProductForm();
    initPasswordForm();
    initLogout();
    renderProducts();
    renderSuggestionsForModeration();
});

// ==================== AUTH ====================
function checkAuth() {
    const isAuth = localStorage.getItem(STORAGE_KEYS.adminAuth) === 'true';
    if (!isAuth) {
        window.location.href = 'login.html';
    }
}

function initLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión?')) {
                localStorage.removeItem(STORAGE_KEYS.adminAuth);
                window.location.href = 'login.html';
            }
        });
    }
}

// ==================== THEME ====================
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark');
    updateThemeButton();
    
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        updateThemeButton();
    });
}

function updateThemeButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const dark = document.body.classList.contains('dark');
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

// ==================== TABS ====================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    Object.values(tabs).forEach(t => {
        if (t) t.classList.remove('active');
    });
    
    if (tabs[tabName]) {
        tabs[tabName].classList.add('active');
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
}

// ==================== PRODUCTOS ====================
function initProductForm() {
    const form = document.getElementById('product-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = (document.getElementById('product-name')?.value || '').trim();
        const description = (document.getElementById('product-description')?.value || '').trim();
        const price = Number(document.getElementById('product-price')?.value || 0);
        const image = (document.getElementById('product-image')?.value || '').trim();
        const stock = Number(document.getElementById('product-stock')?.value || 1);

        if (!name || !description || !image || price <= 0) {
            alert('⚠️ Por favor completa todos los campos correctamente');
            return;
        }

        const product = {
            id: Date.now(),
            name,
            description,
            price,
            image,
            stock,
            createdAt: new Date().toISOString()
        };

        const products = loadProducts();
        products.unshift(product);
        saveProducts(products);
        
        form.reset();
        renderProducts();
        alert('✅ Producto agregado correctamente');
    });
}

function renderProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    const products = loadProducts();
    container.innerHTML = '';

    if (!products.length) {
        container.innerHTML = '<p class="empty-state">No hay productos registrados.</p>';
        return;
    }

    products.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'admin-item';

        item.innerHTML = `
            <div style="width:80px;flex-shrink:0">
                <img src="${prod.image}" alt="${escapeHtml(prod.name)}"
                     style="width:100%;height:80px;object-fit:cover;border-radius:8px"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ccc%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
            </div>
            <div class="admin-item-content" style="flex:1">
                <div class="admin-item-title">${escapeHtml(prod.name)}</div>
                <div class="admin-item-meta">
                    $${prod.price.toLocaleString()} CLP • Stock: ${prod.stock}
                </div>
                <div class="admin-item-desc">${escapeHtml(prod.description)}</div>
            </div>
            <div class="admin-item-actions">
                <button class="btn-secondary edit-btn">✏️ Editar</button>
                <button class="btn-danger delete-btn">🗑️ Eliminar</button>
            </div>
        `;

        item.querySelector('.edit-btn').addEventListener('click', () => {
            document.getElementById('product-name').value = prod.name;
            document.getElementById('product-description').value = prod.description;
            document.getElementById('product-price').value = prod.price;
            document.getElementById('product-image').value = prod.image;
            document.getElementById('product-stock').value = prod.stock;

            const updated = products.filter(p => p.id !== prod.id);
            saveProducts(updated);
            renderProducts();
            switchTab('productos');
        });

        item.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`¿Eliminar "${prod.name}"?`)) {
                const updated = products.filter(p => p.id !== prod.id);
                saveProducts(updated);
                renderProducts();
            }
        });

        container.appendChild(item);
    });
}

function loadProducts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || '[]');
    } catch {
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

// ==================== SUGERENCIAS ====================
function renderSuggestionsForModeration() {
    const container = document.getElementById('moderacion-list');
    if (!container) return;

    const suggestions = loadSuggestions();
    container.innerHTML = '';

    if (!suggestions.length) {
        container.innerHTML = '<p class="empty-state">No hay sugerencias para moderar.</p>';
        return;
    }

    suggestions.forEach(sug => {
        const item = document.createElement('div');
        item.className = 'admin-item';

        item.innerHTML = `
            <div class="admin-item-content" style="flex:1">
                <div class="admin-item-title">${escapeHtml(sug.title)}</div>
                <div class="admin-item-meta">
                    ${escapeHtml(sug.name)} • ${new Date(sug.createdAt).toLocaleString()}
                </div>
                <div class="admin-item-desc">${escapeHtml(sug.message)}</div>
            </div>
            <div class="admin-item-actions">
                <button class="btn-danger delete-btn">🗑️ Eliminar</button>
            </div>
        `;

        item.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('¿Eliminar esta sugerencia?')) {
                const updated = suggestions.filter(s => s.id !== sug.id);
                saveSuggestions(updated);
                renderSuggestionsForModeration();
            }
        });

        container.appendChild(item);
    });
}

function loadSuggestions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.suggestions) || '[]');
    } catch {
        return [];
    }
}

function saveSuggestions(suggestions) {
    localStorage.setItem(STORAGE_KEYS.suggestions, JSON.stringify(suggestions));
}

// ==================== CONTRASEÑA ====================
function initPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const current = document.getElementById('current-password')?.value || '';
        const newPwd = document.getElementById('new-password')?.value || '';
        const confirmPwd = document.getElementById('confirm-password')?.value || '';

        const savedPassword = localStorage.getItem(STORAGE_KEYS.adminPassword) || ADMIN_PASSWORD;

        if (current !== savedPassword) {
            alert('❌ Contraseña actual incorrecta');
            return;
        }

        if (!newPwd || newPwd.length < 6) {
            alert('⚠️ Mínimo 6 caracteres');
            return;
        }

        if (newPwd !== confirmPwd) {
            alert('❌ Las contraseñas no coinciden');
            return;
        }

        localStorage.setItem(STORAGE_KEYS.adminPassword, newPwd);
        alert('✅ Contraseña actualizada');
        form.reset();
    });
}

// ==================== UTILS ====================
function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[s]));
}