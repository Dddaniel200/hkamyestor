import { SuggestionsService } from "./modules/suggestions.service.js";
import { CONFIG } from "./core/config.js";
import { Api } from "./core/api.js"; // Importamos Api para traer los productos

const selectors = {
  themeToggle: '#theme-toggle',
  stars: '.star',
  ratingValue: '#rating-value',
  form: '#suggestion-form',
  name: '#name',
  title: '#title',
  message: '#message',
  suggestionsContainer: '#suggestions-container',
  productsContainer: '#productos-lista', // Asegúrate de que este ID exista en tu index.html
  filterSelect: '#filter-rating',
  adminControls: '#admin-controls'
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRating();
  initForm();
  initFilter();
  renderSuggestions();
  renderProducts(); // <-- NUEVA FUNCIÓN PARA LOS BOLSOS
  revealAdminIfNeeded();
});

/* PRODUCTOS: Cargar desde Aiven */
async function renderProducts() {
  const container = document.querySelector('#productos-lista') || document.querySelector('.productos-grid');
  if (!container) return;

  try {
    const productos = await Api.getProducts();
    container.innerHTML = '';

    if (!productos || productos.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay productos disponibles por ahora.</p>';
      return;
    }

    productos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'producto-card';
      card.innerHTML = `
        <img src="${p.imagen || 'https://via.placeholder.com/200'}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || ''}</p>
        <span class="precio">$${Number(p.precio).toLocaleString('es-CL')} CLP</span>
        <button class="btn-comprar">Ver Detalle</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error cargando productos:', err);
    container.innerHTML = '<p class="error-state">Error al conectar con el servidor.</p>';
  }
}

/* THEME */
function initTheme() {
  const btn = query(selectors.themeToggle);
  const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeButton();
  if (btn) {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      updateThemeButton();
    });
  }
}

function updateThemeButton() {
  const btn = query(selectors.themeToggle);
  if (!btn) return;
  const dark = document.body.classList.contains('dark');
  btn.textContent = dark ? '☀️' : '🌙';
  btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

/* RATING (form) */
let currentRating = 0;
function initRating() {
  const starButtons = qAll(selectors.stars);
  const display = query(selectors.ratingValue);
  if (!starButtons.length || !display) return;
  starButtons.forEach(btn => {
    const v = Number(btn.dataset.value || 0);
    btn.addEventListener('click', () => setRating(v));
    btn.addEventListener('mouseover', () => previewRating(v));
    btn.addEventListener('mouseout', () => previewRating(currentRating));
  });
  previewRating(0);
}

function setRating(value) {
  currentRating = value;
  previewRating(value);
}

function previewRating(value) {
  qAll(selectors.stars).forEach(btn => {
    const v = Number(btn.dataset.value || 0);
    btn.classList.toggle('active', v <= value && value > 0);
  });
  const display = query(selectors.ratingValue);
  if (display) display.textContent = `${value} / 5`;
}

/* FORM: guardar sugerencia */
function initForm() {
  const form = query(selectors.form);
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = (query(selectors.name)?.value || '').trim();
    const title = (query(selectors.title)?.value || '').trim();
    const message = (query(selectors.message)?.value || '').trim();
    const rating = currentRating || 0;

    if (!title || !message) {
      alert('Por favor completa título y mensaje.');
      return;
    }

    const suggestion = {
      name: name || 'Anónimo',
      title,
      message,
      rating
    };

    try {
      await SuggestionsService.create(suggestion);
      form.reset();
      setRating(0);
      alert('¡Sugerencia enviada con éxito!');
      await renderSuggestions();
    } catch (err) {
      console.error('Error enviando sugerencia:', err);
      alert('Hubo un problema al enviar tu sugerencia.');
    }
  });

  form.addEventListener('reset', () => {
    setRating(0);
  });
}

/* FILTRAR */
function initFilter() {
  const select = query(selectors.filterSelect);
  if (!select) return;
  select.addEventListener('change', () => renderSuggestions());
}

/* RENDER SUGERENCIAS */
async function renderSuggestions() {
  const container = query(selectors.suggestionsContainer);
  if (!container) return;
  const all = await loadSuggestions();
  const filter = query(selectors.filterSelect)?.value || 'all';
  const list = filter === 'all' ? all : all.filter(s => Number(s.rating) === Number(filter));

  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<p class="empty-state">Aún no hay sugerencias registradas.</p>';
    return;
  }

  list.forEach(s => {
    const card = document.createElement('article');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <div class="suggestion-title">${escapeHtml(s.title)}</div>
      <div class="suggestion-meta">
        <span class="kv">${escapeHtml(s.name)}</span> • 
        <span>${new Date(s.createdAt).toLocaleString()}</span>
      </div>
      <div class="stars">
        ${'★'.repeat(s.rating).padEnd(5, '☆')}
      </div>
      <p style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(s.message)}</p>
    `;
    container.appendChild(card);
  });
}

async function loadSuggestions() {
  try {
    return await SuggestionsService.getAll();
  } catch (e) {
    console.warn('No se pudieron cargar sugerencias:', e);
    return [];
  }
}

function revealAdminIfNeeded() {
  const admin = localStorage.getItem('isAdmin') === 'true';
  const el = query(selectors.adminControls);
  if (!el) return;
  if (admin) el.classList.remove('hidden');
}

/* UTIL */
function query(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
