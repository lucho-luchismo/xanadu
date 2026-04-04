const STORAGE_KEY = 'xanadu.library.v1';
const SETTINGS_KEY = 'xanadu.settings.v1';
const GEM_LIMIT = 12;

const DEFAULT_ITEMS = [
  {
    id: crypto.randomUUID(),
    title: 'Historia',
    subtitle: '',
    authors: 'Yuval Noah Harari',
    type: 'Libro',
    publisher: 'Siglo XXI',
    genre: '',
    year: '2012',
    language: 'Español',
    guardian: '',
    notes: '',
    image: '',
    status: 'Biblioteca',
    loanedTo: '',
    loanHistory: [],
    isGem: true,
    discover: false,
    createdAt: new Date().toISOString(),
  },
];

const el = {
  appNotice: document.getElementById('appNotice'),
  searchDesktop: document.getElementById('searchInputDesktop'),
  searchMobile: document.getElementById('searchInputMobile'),
  statusFiltersDesktop: document.getElementById('statusFiltersDesktop'),
  statusFiltersMobile: document.getElementById('statusFiltersMobile'),
  decadeFiltersDesktop: document.getElementById('decadeFiltersDesktop'),
  decadeFiltersMobile: document.getElementById('decadeFiltersMobile'),
  languageFiltersDesktop: document.getElementById('languageFiltersDesktop'),
  languageFiltersMobile: document.getElementById('languageFiltersMobile'),
  tabs: [...document.querySelectorAll('.tab-button')],
  bottomNavButtons: [...document.querySelectorAll('.bottom-nav-button')],
  sortChips: [...document.querySelectorAll('#sortChips .chip')],
  decadeQuickFilters: document.getElementById('decadeQuickFilters'),
  languageQuickFilters: document.getElementById('languageQuickFilters'),
  summaryStrip: document.getElementById('summaryStrip'),
  emptyState: document.getElementById('emptyState'),
  cardGrid: document.getElementById('cardGrid'),
  addButton: document.getElementById('addButton'),
  itemModal: document.getElementById('itemModal'),
  modalTitle: document.getElementById('modalTitle'),
  closeModalButton: document.getElementById('closeModalButton'),
  itemForm: document.getElementById('itemForm'),
  imagePreview: document.getElementById('imagePreview'),
  imageInputCamera: document.getElementById('imageInputCamera'),
  imageInputFile: document.getElementById('imageInputFile'),
  deleteButton: document.getElementById('deleteButton'),
  settingsButton: document.getElementById('settingsButton'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsButton: document.getElementById('closeSettingsButton'),
  exportButton: document.getElementById('exportButton'),
  importInput: document.getElementById('importInput'),
  resetButton: document.getElementById('resetButton'),
};

const state = {
  items: [],
  search: '',
  currentView: 'library',
  sortBy: 'recent',
  editingId: null,
  lastGuardian: '',
  filters: {
    statuses: new Set(),
    decades: new Set(),
    languages: new Set(),
  },
};

init();

function init() {
  state.items = loadItems();
  state.lastGuardian = loadSettings().lastGuardian || '';
  bindEvents();
  render();
  registerServiceWorker();
}

function bindEvents() {
  el.searchDesktop?.addEventListener('input', onSearchInput);
  el.searchMobile?.addEventListener('input', onSearchInput);
  el.tabs.forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  el.bottomNavButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  el.sortChips.forEach(button => button.addEventListener('click', () => setSort(button.dataset.sort)));

  el.addButton.addEventListener('click', () => openItemModal());
  el.closeModalButton.addEventListener('click', closeItemModal);
  el.itemForm.addEventListener('submit', handleFormSubmit);
  el.imageInputCamera.addEventListener('change', handleImageChange);
  el.imageInputFile.addEventListener('change', handleImageChange);
  el.deleteButton.addEventListener('click', handleDeleteItem);

  el.settingsButton.addEventListener('click', openSettingsModal);
  el.closeSettingsButton.addEventListener('click', closeSettingsModal);
  el.exportButton.addEventListener('click', exportJson);
  el.importInput.addEventListener('change', importJson);
  el.resetButton.addEventListener('click', resetLibrary);

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-card-id]');
    const action = event.target.closest('[data-action]');
    if (action) {
      handleCardAction(action.dataset.action, action.dataset.id);
      return;
    }
    if (card && !event.target.closest('button')) {
      openItemModal(card.dataset.cardId);
    }
    if (event.target.matches('[data-close-modal="true"]')) closeItemModal();
    if (event.target.matches('[data-close-settings="true"]')) closeSettingsModal();
  });
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
  return DEFAULT_ITEMS;
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function save(showMessage = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lastGuardian: state.lastGuardian }));
    if (showMessage) showNotice('Cambios guardados.', 'success', 1200);
    return true;
  } catch (error) {
    console.error(error);
    showNotice('No se pudo guardar. Probá con una imagen más liviana o exportá y liberá espacio del navegador.', 'error', 5000);
    return false;
  }
}

function onSearchInput(event) {
  state.search = event.target.value;
  if (el.searchDesktop && el.searchDesktop.value !== state.search) el.searchDesktop.value = state.search;
  if (el.searchMobile && el.searchMobile.value !== state.search) el.searchMobile.value = state.search;
  render();
}

function setView(view) {
  state.currentView = view;
  syncActiveButtons();
  render();
}

function setSort(sort) {
  state.sortBy = sort;
  el.sortChips.forEach(chip => chip.classList.toggle('active', chip.dataset.sort === sort));
  render();
}

function syncActiveButtons() {
  el.tabs.forEach(button => button.classList.toggle('active', button.dataset.view === state.currentView));
  el.bottomNavButtons.forEach(button => button.classList.toggle('active', button.dataset.view === state.currentView));
}

function render() {
  renderFilters();
  const items = getVisibleItems();
  renderSummary(items);
  renderGrid(items);
}

function renderFilters() {
  const statuses = ['Biblioteca', 'A descubrir', 'Va y vuelve'];
  const decades = [...new Set(state.items.map(item => deriveDecade(item.year)).filter(Boolean))].sort();
  const languages = ['Español', 'Inglés', 'Francés', 'Otros'];

  renderCheckList(el.statusFiltersDesktop, statuses, state.filters.statuses, toggleStatusFilter);
  renderCheckList(el.statusFiltersMobile, statuses, state.filters.statuses, toggleStatusFilter);
  renderCheckList(el.decadeFiltersDesktop, decades, state.filters.decades, toggleDecadeFilter);
  renderCheckList(el.decadeFiltersMobile, decades, state.filters.decades, toggleDecadeFilter);
  renderChipSelector(el.languageFiltersDesktop, languages, state.filters.languages, toggleLanguageFilter);
  renderChipSelector(el.languageFiltersMobile, languages, state.filters.languages, toggleLanguageFilter);
  renderChipSelector(el.decadeQuickFilters, decades, state.filters.decades, toggleDecadeFilter);
  renderChipSelector(el.languageQuickFilters, ['ES', 'EN', 'FR', 'Otros'], new Set([...state.filters.languages].map(shortLanguage)), toggleQuickLanguage);
}

function renderCheckList(container, values, selectedSet, onToggle) {
  if (!container) return;
  container.innerHTML = '';
  values.forEach(value => {
    const label = document.createElement('label');
    label.className = 'check-option';
    const checked = selectedSet.has(value);
    label.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''}> <span>${value}</span>`;
    label.querySelector('input').addEventListener('change', () => onToggle(value));
    container.appendChild(label);
  });
}

function renderChipSelector(container, values, selectedSet, onToggle) {
  if (!container) return;
  container.innerHTML = '';
  values.forEach(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${selectedSet.has(value) ? 'active' : ''}`;
    button.textContent = value;
    button.addEventListener('click', () => onToggle(value));
    container.appendChild(button);
  });
}

function toggleStatusFilter(value) {
  toggleSetValue(state.filters.statuses, value);
  render();
}

function toggleDecadeFilter(value) {
  toggleSetValue(state.filters.decades, value);
  render();
}

function toggleLanguageFilter(value) {
  toggleSetValue(state.filters.languages, value);
  render();
}

function toggleQuickLanguage(shortValue) {
  const mapping = { ES: 'Español', EN: 'Inglés', FR: 'Francés', Otros: 'Otros' };
  toggleSetValue(state.filters.languages, mapping[shortValue]);
  render();
}

function toggleSetValue(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function getVisibleItems() {
  const needle = normalizeText(state.search);
  let items = [...state.items];

  if (state.currentView === 'gems') items = items.filter(item => item.isGem);
  if (state.currentView === 'discover') items = items.filter(item => item.discover);
  if (state.currentView === 'loans') items = items.filter(item => item.status === 'Va y vuelve');
  if (state.currentView === 'library') items = items.filter(item => item.status === 'Biblioteca');

  if (state.filters.statuses.size) {
    items = items.filter(item => {
      const statesForItem = new Set([item.status, item.discover ? 'A descubrir' : null].filter(Boolean));
      return [...state.filters.statuses].some(filter => statesForItem.has(filter));
    });
  }

  if (state.filters.decades.size) items = items.filter(item => state.filters.decades.has(deriveDecade(item.year)));
  if (state.filters.languages.size) items = items.filter(item => state.filters.languages.has(item.language || 'Otros'));

  if (needle) {
    items = items.filter(item => normalizeText([
      item.title,
      item.subtitle,
      item.authors,
      item.publisher,
      item.genre,
      item.language,
      item.guardian,
      item.loanedTo,
      item.notes,
    ].join(' ')).includes(needle));
  }

  items.sort(sorterFor(state.sortBy));
  return items;
}

function sorterFor(mode) {
  if (mode === 'year') return (a, b) => Number(b.year || 0) - Number(a.year || 0);
  if (mode === 'author') return (a, b) => (a.authors || '').localeCompare(b.authors || '', 'es', { sensitivity: 'base' });
  return (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function renderSummary(items) {
  const total = items.length;
  const gems = items.filter(item => item.isGem).length;
  const discover = items.filter(item => item.discover).length;
  const loans = items.filter(item => item.status === 'Va y vuelve').length;
  el.summaryStrip.textContent = `${total} item${total === 1 ? '' : 's'} visibles · ${gems} joyita${gems === 1 ? '' : 's'} · ${discover} por descubrir · ${loans} en va y vuelve`;
}

function renderGrid(items) {
  el.cardGrid.innerHTML = '';
  const isEmpty = items.length === 0;
  el.emptyState.classList.toggle('hidden', !isEmpty);
  if (isEmpty) {
    el.emptyState.innerHTML = `<strong>No hay ítems para mostrar.</strong><br>Probá cambiar la vista, limpiar filtros o agregar tu primer libro.`;
    return;
  }

  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'item-card';
    article.dataset.cardId = item.id;

    const decade = deriveDecade(item.year);
    const loanHistoryHTML = item.loanHistory?.length
      ? `<section class="loan-history-panel"><h4>Historial de préstamos</h4><div class="loan-history-list">${item.loanHistory.map(entry => `<div class="loan-entry">${escapeHTML(entry.person)} · ${formatDate(entry.date)}</div>`).join('')}</div></section>`
      : '';

    article.innerHTML = `
      <div class="cover">${renderCover(item)}</div>
      <div class="card-body">
        <div class="card-title">${escapeHTML(item.title)}</div>
        ${item.subtitle ? `<div class="card-subtitle">${escapeHTML(item.subtitle)}</div>` : ''}
        ${item.authors ? `<div class="card-authors">${escapeHTML(item.authors)}</div>` : ''}
        <div class="badge-row">
          <span class="badge">${escapeHTML(item.type || 'Objeto')}</span>
          ${item.status === 'Va y vuelve' ? `<span class="badge loan-badge">Prestado${item.loanedTo ? ` a ${escapeHTML(item.loanedTo)}` : ''}</span>` : ''}
          ${decade ? `<span class="badge">${decade}</span>` : ''}
          ${item.language ? `<span class="badge">${shortLanguage(item.language)}</span>` : ''}
        </div>
        ${item.publisher || item.year ? `<div class="card-meta">${[item.publisher, item.year].filter(Boolean).join(' · ')}</div>` : ''}
        ${item.guardian ? `<div class="card-foot">Guardián: ${escapeHTML(item.guardian)}</div>` : ''}
        <div class="card-actions">
          <button class="action-pill ${item.isGem ? 'active' : ''}" data-action="toggle-gem" data-id="${item.id}">💎 Joyita</button>
          <button class="action-pill ${item.discover ? 'active' : ''}" data-action="toggle-discover" data-id="${item.id}">🧭 Descubrir</button>
          ${item.status === 'Va y vuelve'
            ? `<button class="action-pill active" data-action="toggle-status" data-id="${item.id}">👜 Va y vuelve</button>`
            : `<button class="action-pill" data-action="toggle-status" data-id="${item.id}">📚 Biblioteca</button>`}
        </div>
        ${loanHistoryHTML}
      </div>
    `;
    el.cardGrid.appendChild(article);
  });
}

function renderCover(item) {
  if (item.image) return `<img src="${item.image}" alt="${escapeHTML(item.title)}">`;
  return `<div class="cover-fallback">${escapeHTML(item.title)}</div>`;
}

function handleCardAction(action, id) {
  const item = state.items.find(entry => entry.id === id);
  if (!item) return;

  if (action === 'toggle-gem') {
    if (!item.isGem && state.items.filter(entry => entry.isGem).length >= GEM_LIMIT) {
      alert(`Joyitas tiene un límite blando de ${GEM_LIMIT}.`);
    }
    item.isGem = !item.isGem;
  }

  if (action === 'toggle-discover') item.discover = !item.discover;

  if (action === 'toggle-status') {
    if (item.status === 'Biblioteca') {
      const person = prompt('¿A quién se prestó?');
      item.status = 'Va y vuelve';
      item.loanedTo = person?.trim() || '';
      if (item.loanedTo) {
        item.loanHistory = item.loanHistory || [];
        item.loanHistory.unshift({ person: item.loanedTo, date: new Date().toISOString() });
      }
    } else {
      item.status = 'Biblioteca';
      item.loanedTo = '';
    }
  }

  save();
  render();
}

function openItemModal(id = null) {
  state.editingId = id;
  el.itemForm.reset();
  el.imageInputCamera.value = '';
  el.imageInputFile.value = '';
  el.imagePreview.innerHTML = 'Sin imagen';
  delete el.imagePreview.dataset.image;
  el.deleteButton.classList.toggle('hidden', !id);

  if (id) {
    const item = state.items.find(entry => entry.id === id);
    if (!item) return;
    el.modalTitle.textContent = 'Editar';
    fillForm(item);
  } else {
    el.modalTitle.textContent = 'Agregar';
    el.itemForm.elements.language.value = 'Español';
    el.itemForm.elements.status.value = 'Biblioteca';
    el.itemForm.elements.guardian.value = state.lastGuardian || '';
  }

  document.body.classList.add('modal-open');
  el.itemModal.classList.remove('hidden');
  el.itemModal.setAttribute('aria-hidden', 'false');
}

function closeItemModal() {
  document.body.classList.remove('modal-open');
  el.itemModal.classList.add('hidden');
  el.itemModal.setAttribute('aria-hidden', 'true');
  state.editingId = null;
}

function fillForm(item) {
  for (const [key, value] of Object.entries(item)) {
    const field = el.itemForm.elements[key];
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value ?? '';
  }
  if (item.image) {
    el.imagePreview.innerHTML = `<img src="${item.image}" alt="Vista previa">`;
    el.imagePreview.dataset.image = item.image;
  }
}

async function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    showNotice('Procesando imagen…', 'info', 2000);
    const base64 = await prepareImageForStorage(file);
    el.imagePreview.innerHTML = `<img src="${base64}" alt="Vista previa">`;
    el.imagePreview.dataset.image = base64;
    showNotice('Imagen lista para guardar.', 'success', 2000);
  } catch (error) {
    console.error(error);
    showNotice('No se pudo procesar la imagen.', 'error', 3200);
  } finally {
    event.target.value = '';
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = new FormData(el.itemForm);
  const existing = state.editingId ? state.items.find(entry => entry.id === state.editingId) : null;
  const title = String(form.get('title') || '').trim();
  if (!title) {
    showNotice('El título es obligatorio.', 'error', 2600);
    return;
  }

  const status = String(form.get('status') || 'Biblioteca');
  const loanedTo = String(form.get('loanedTo') || '').trim();
  const nextItem = {
    id: existing?.id || crypto.randomUUID(),
    title,
    subtitle: String(form.get('subtitle') || '').trim(),
    authors: String(form.get('authors') || '').trim(),
    type: String(form.get('type') || 'Libro'),
    publisher: String(form.get('publisher') || '').trim(),
    genre: String(form.get('genre') || '').trim(),
    year: String(form.get('year') || '').trim(),
    language: String(form.get('language') || 'Español'),
    guardian: String(form.get('guardian') || '').trim(),
    notes: String(form.get('notes') || '').trim(),
    image: el.imagePreview.dataset.image || existing?.image || '',
    status,
    loanedTo,
    loanHistory: existing?.loanHistory || [],
    isGem: el.itemForm.elements.isGem.checked,
    discover: el.itemForm.elements.discover.checked,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  if (status === 'Va y vuelve' && loanedTo) {
    const previousPerson = existing?.loanedTo || '';
    if (loanedTo !== previousPerson) {
      nextItem.loanHistory = [{ person: loanedTo, date: new Date().toISOString() }, ...nextItem.loanHistory];
    }
  }

  state.lastGuardian = nextItem.guardian || state.lastGuardian;

  if (existing) {
    const index = state.items.findIndex(entry => entry.id === existing.id);
    state.items[index] = nextItem;
  } else {
    state.items.unshift(nextItem);
  }

  const saved = save(false);
  if (!saved) return;
  render();
  closeItemModal();
  showNotice('Ítem guardado.', 'success', 1600);
}

function handleDeleteItem() {
  if (!state.editingId) return;
  const confirmed = confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.');
  if (!confirmed) return;
  state.items = state.items.filter(item => item.id !== state.editingId);
  const saved = save(false);
  if (!saved) return;
  render();
  closeItemModal();
  showNotice('Ítem eliminado.', 'success', 1600);
}

function openSettingsModal() {
  document.body.classList.add('modal-open');
  el.settingsModal.classList.remove('hidden');
  el.settingsModal.setAttribute('aria-hidden', 'false');
}

function closeSettingsModal() {
  document.body.classList.remove('modal-open');
  el.settingsModal.classList.add('hidden');
  el.settingsModal.setAttribute('aria-hidden', 'true');
}

function exportJson() {
  const payload = JSON.stringify(state.items, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'xanadu-backup.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido');
      state.items = parsed;
      save(false);
      render();
      closeSettingsModal();
      showNotice('Biblioteca importada correctamente.', 'success', 2400);
    } catch {
      showNotice('No se pudo importar el archivo JSON.', 'error', 2800);
    }
  };
  reader.readAsText(file);
}

function resetLibrary() {
  const confirmed = confirm('¿Seguro que querés borrar toda la biblioteca local?');
  if (!confirmed) return;
  state.items = [];
  save(false);
  render();
  closeSettingsModal();
  showNotice('Biblioteca vaciada.', 'success', 2200);
}

function deriveDecade(year) {
  const numericYear = Number(year);
  if (!numericYear) return '';
  return `${Math.floor(numericYear / 10) * 10}`;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function shortLanguage(value) {
  const map = { Español: 'ES', Inglés: 'EN', Francés: 'FR', Otros: 'Otros' };
  return map[value] || value || '';
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function prepareImageForStorage(file) {
  const dataUrl = await fileToBase64(file);
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const maxLongEdge = 960;
  const scale = Math.min(1, maxLongEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#efe2cc';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.72;
  let output = canvas.toDataURL('image/jpeg', quality);
  while (output.length > 800000 && quality > 0.46) {
    quality -= 0.08;
    output = canvas.toDataURL('image/jpeg', quality);
  }
  return output;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function showNotice(message, tone = 'info', timeout = 2400) {
  if (!el.appNotice) return;
  el.appNotice.textContent = message;
  el.appNotice.className = `app-notice ${tone}`;
  if (showNotice.timer) clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => {
    el.appNotice.className = 'app-notice hidden';
  }, timeout);
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}
