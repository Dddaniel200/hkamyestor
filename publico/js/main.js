
import { SuggestionsService } from "./modules/suggestions.service.js";
import { CONFIG } from "./core/config.js";

const selectors = {
  themeToggle: '#theme-toggle',
  stars: '.star',
  ratingValue: '#rating-value',
  form: '#suggestion-form',
  name: '#name',
  title: '#title',
  message: '#message',
  suggestionsContainer: '#suggestions-container',
  filterSelect: '#filter-rating',
  adminControls: '#admin-controls'
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRating();
  initForm();
  initFilter();
  renderSuggestions();
  revealAdminIfNeeded();
});

/* THEME */
function initTheme() {
  const btn = query(selectors.themeToggle);
  const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeButton();
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
  });
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
      id: Date.now(),
      name: name || 'Anónimo',
      title,
      message,
      rating,
      createdAt: new Date().toISOString()
    };

    // Si está habilitado el backend, enviamos al servidor. Si falla, guardamos localmente.
    if (CONFIG && CONFIG.USE_BACKEND) {
      try {
        await SuggestionsService.create(suggestion);
      } catch (err) {
        console.error('Error enviando sugerencia al backend, guardando localmente', err);
        const list = loadSuggestions();
        list.unshift(suggestion);
        saveSuggestions(list);
      }
    } else {
      const list = loadSuggestions();
      list.unshift(suggestion);
      saveSuggestions(list);
    }

    form.reset();
    setRating(0);
    await renderSuggestions();
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

/* RENDER */
async function renderSuggestions() {
  const container = query(selectors.suggestionsContainer);
  if (!container) return;
  const all = await loadSuggestions();
  const filter = query(selectors.filterSelect)?.value || 'all';
  const list = filter === 'all' ? all : all.filter(s => Number(s.rating) === Number(filter));

  container.innerHTML = '';
  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'Aún no hay sugerencias registradas.';
    container.appendChild(p);
    return;
  }

  list.forEach(s => {
    const card = document.createElement('article');
    card.className = 'suggestion-card';

    const h3 = document.createElement('div');
    h3.className = 'suggestion-title';
    h3.textContent = s.title;

    const meta = document.createElement('div');
    meta.className = 'suggestion-meta';
    meta.innerHTML = `<span class="kv">${escapeHtml(s.name)}</span> • <span>${new Date(s.createdAt).toLocaleString()}</span>`;

    const stars = document.createElement('div');
    stars.className = 'stars';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.textContent = '★';
      star.style.color = i <= s.rating ? getComputedStyle(document.documentElement).getPropertyValue('--accent-2') || '#ffb020' : 'var(--muted)';
      star.style.marginRight = '4px';
      stars.appendChild(star);
    }

    const msg = document.createElement('p');
    msg.textContent = s.message;
    msg.style.marginTop = '8px';
    msg.style.whiteSpace = 'pre-wrap';

    card.appendChild(h3);
    card.appendChild(meta);
    card.appendChild(stars);
    card.appendChild(msg);
    container.appendChild(card);
  });
}

/* STORAGE */
async function loadSuggestions() {
  try {
    if (CONFIG && CONFIG.USE_BACKEND) {
      try {
        const data = await SuggestionsService.getAll();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Error al obtener sugerencias del backend:', err);
        // fallback a localStorage
      }
    }
    const raw = localStorage.getItem('suggestions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('No se pudieron cargar sugerencias:', e);
    return [];
  }
}
function saveSuggestions(list) {
  try {
    localStorage.setItem('suggestions', JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudieron guardar sugerencias:', e);
  }
}

/* ADMIN: muestra controles solo si isAdmin=true en localStorage */
function revealAdminIfNeeded() {
  const admin = localStorage.getItem('isAdmin') === 'true';
  const el = query(selectors.adminControls);
  if (!el) return;
  if (admin) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

/* UTIL */
function query(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}