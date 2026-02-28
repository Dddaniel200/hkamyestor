// Reemplaza tus funciones de Productos y Sugerencias por estas:

// CARGAR PRODUCTOS DESDE EL SERVIDOR
async function renderProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    try {
        const res = await fetch('/api/productos');
        const products = await res.json();
        
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay productos.</p>';
            return;
        }

        products.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div class="admin-item-content">
                    <div class="admin-item-title">${prod.nombre}</div>
                    <div class="admin-item-meta">$${prod.precio} - Stock: ${prod.stock}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-danger" onclick="deleteProduct(${prod.id})">🗑️ Eliminar</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) { console.error("Error cargando productos", err); }
}

// ELIMINAR PRODUCTO
async function deleteProduct(id) {
    if (confirm('¿Eliminar producto?')) {
        await fetch(`/api/productos/${id}`, { method: 'DELETE' });
        renderProducts();
    }
}

// AGREGAR PRODUCTO AL SERVIDOR
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: document.getElementById('product-price').value,
        image: document.getElementById('product-image').value,
        stock: document.getElementById('product-stock').value
    };

    await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    });

    e.target.reset();
    renderProducts();
    alert("Producto agregado!");
});

// MODERAR SUGERENCIAS (ELIMINAR)
async function deleteSuggestion(id) {
    if (confirm('¿Eliminar esta sugerencia?')) {
        await fetch(`/api/sugerencias/${id}`, { method: 'DELETE' });
        renderSuggestionsForModeration();
    }
}

// ==================== HISTORIA ====================
// Cargar la historia actual al entrar
async function cargarHistoria() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        document.getElementById('historia-texto').value = data.valor || '';
    } catch (err) { console.error("Error cargando historia"); }
}

// Guardar la nueva historia
document.getElementById('historia-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoTexto = document.getElementById('historia-texto').value;
    
    try {
        await fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: nuevoTexto })
        });
        alert('✅ Historia actualizada correctamente');
    } catch (err) { alert('❌ Error al guardar'); }
});

// Llama a cargarHistoria() cuando la página cargue (agrégalo en tu DOMContentLoaded inicial)
document.addEventListener('DOMContentLoaded', () => {
    cargarHistoria(); // <--- Agrega esta línea a tu inicio
    // ... tus otras funciones
});

