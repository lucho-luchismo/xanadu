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
    genre: 'Historia',
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Fundación',
    subtitle: '',
    authors: 'Isaac Asimov',
    type: 'Libro',
    publisher: 'Planeta',
    genre: 'Ciencia ficción',
    year: '1987',
    language: 'Español',
    guardian: '',
    notes: '',
    image: '',
    status: 'Biblioteca',
    loanedTo: '',
    loanHistory: [],
    isGem: false,
    discover: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Sandman',
    subtitle: '',
    authors: 'Neil Gaiman',
    type: 'Comic',
    publisher: 'ECC',
    genre: 'Fantasía',
    year: '2016',
    language: 'Español',
    guardian: '',
    notes: '',
    image: '',
    status: 'Va y vuelve',
    loanedTo: 'Marina',
    loanHistory: [{ person: 'Marina', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString() }],
    isGem: true,
    discover: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const state = {
  items: loadItems(),
  currentView: 'library',
  sortBy: 'recent',
  search: '',
  filters: {
    statuses: new Set(),
    decades: new Set(),
    languages: new Set(),
  },
  editingId: null,
  lastGuardian: loadSettings().lastGuardian || '',
};

const el = {
  cardGrid: document.getElementById('cardGrid'),
  emptyState: document.getElementById('emptyState'),
  summaryStrip: document.getElementById('summaryStrip'),
  searchDesktop: document.getElementById('searchInputDesktop'),
  searchMobile: document.getElementById('searchInputMobile'),
  tabs: [...document.querySelectorAll('.tab-button')],
  bottomNavButtons: [...document.querySelectorAll('.bottom-nav-button')],
  sortChips: [...document.querySelectorAll('#sortChips .chip')],
  addButton: document.getElementById('addButton'),
  itemModal: document.getElementById('itemModal'),
  modalTitle: document.getElementById('modalTitle'),
  closeModalButton: document.getElementById('closeModalButton'),
  itemForm: document.getElementById('itemForm'),
  imageInput: document.getElementById('imageInput'),
  imagePreview: document.getElementById('imagePreview'),
  deleteButton: document.getElementById('deleteButton'),
  settingsButton: document.getElementById('settingsButton'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsButton: document.getElementById('closeSettingsButton'),
  exportButton: document.getElementById('exportButton'),
  importInput: document.getElementById('importInput'),
  resetButton: document.getElementById('resetButton'),
  statusFiltersDesktop: document.getElementById('statusFiltersDesktop'),
  decadeFiltersDesktop: document.getElementById('decadeFiltersDesktop'),
  languageFiltersDesktop: document.getElementById('languageFiltersDesktop'),
  statusFiltersMobile: document.getElementById('statusFiltersMobile'),
  decadeFiltersMobile: document.getElementById('decadeFiltersMobile'),
  languageFiltersMobile: document.getElementById('languageFiltersMobile'),
  decadeQuickFilters: document.getElementById('decadeQuickFilters'),
  languageQuickFilters: document.getElementById('languageQuickFilters'),
};

init();

function init() {
  bindEvents();
  renderFilters();
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
  el.imageInput.addEventListener('change', handleImageChange);
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
    if (Array.isArray(saved) && saved.length) return saved;
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

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lastGuardian: state.lastGuardian }));
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

function renderFilters() {
  const statuses = ['Biblioteca', 'A descubrir', 'Va y vuelve'];
  const decades = [...new Set(state.items.map(item => deriveDecade(item.year)).filter(Boolean))].sort();
  const languages = ['Español', 'Inglés', 'Francés', 'Otros'];

  renderCheckList(el.statusFiltersDesktop, statuses, state.filters.statuses, toggleStatusFilter);
  renderCheckList(el.statusFiltersMobile, statuses, state.filters.statuses, toggleStatusFilter);
  renderCheckList(el.decadeFiltersDesktop, decades, state.filters.decades, toggleDecadeFilter);
  renderCheckList(el.decadeFiltersMobile, decades, state.filters.decades, toggleDecadeFilter);
  renderChipSelector(el.languageFiltersDesktop, languages, state.filters.languages, toggleLanguageFilter, true);
  renderChipSelector(el.languageFiltersMobile, languages, state.filters.languages, toggleLanguageFilter, true);

  renderChipSelector(el.decadeQuickFilters, decades, state.filters.decades, toggleDecadeFilter, false);
  renderChipSelector(el.languageQuickFilters, ['ES', 'EN', 'FR', 'Otros'], new Set([...state.filters.languages].map(shortLanguage)), toggleQuickLanguage, false);
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

function renderChipSelector(container, values, selectedSet, onToggle, useFullLanguageNames) {
  if (!container) return;
  container.innerHTML = '';
  values.forEach(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${selectedSet.has(value) ? 'active' : ''}`;
    button.textContent = useFullLanguageNames ? value : value;
    button.addEventListener('click', () => onToggle(value));
    container.appendChild(button);
  });
}

function toggleStatusFilter(value) {
  toggleSetValue(state.filters.statuses, value);
  renderFilters();
  render();
}

function toggleDecadeFilter(value) {
  toggleSetValue(state.filters.decades, value);
  renderFilters();
  render();
}

function toggleLanguageFilter(value) {
  toggleSetValue(state.filters.languages, value);
  renderFilters();
  render();
}

function toggleQuickLanguage(shortValue) {
  const mapping = { ES: 'Español', EN: 'Inglés', FR: 'Francés', Otros: 'Otros' };
  toggleSetValue(state.filters.languages, mapping[shortValue]);
  renderFilters();
  render();
}

function toggleSetValue(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function render() {
  const items = getVisibleItems();
  renderFilters();
  renderSummary(items);
  renderGrid(items);
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
      const statesForItem = new Set([
        item.status,
        item.discover ? 'A descubrir' : null,
      ].filter(Boolean));
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
  el.summaryStrip.textContent = `${total} item${total === 1 ? '' : 's'} · ${gems} joyita${gems === 1 ? '' : 's'} · ${discover} por descubrir · ${loans} en va y vuelve`;
}

function renderGrid(items) {
  el.cardGrid.innerHTML = '';
  const isEmpty = items.length === 0;
  el.emptyState.classList.toggle('hidden', !isEmpty);
  if (isEmpty) {
    el.emptyState.textContent = 'No hay resultados para esta combinación de vista, filtros y búsqueda.';
    return;
  }

  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'item-card';
    article.dataset.cardId = item.id;

    const cover = renderCover(item);
    const decade = deriveDecade(item.year);
    const loanHistoryHTML = item.loanHistory?.length
      ? `<section class="loan-history-panel"><h4>Historial de préstamos</h4><div class="loan-history-list">${item.loanHistory.map(entry => `<div class="loan-entry">${escapeHTML(entry.person)} · ${formatDate(entry.date)}</div>`).join('')}</div></section>`
      : '';

    article.innerHTML = `
      <div class="cover">${cover}</div>
      <div class="card-body">
        <div class="card-title">${escapeHTML(item.title)}</div>
        ${item.subtitle ? `<div class="card-subtitle">${escapeHTML(item.subtitle)}</div>` : ''}
        ${item.authors ? `<div class="card-authors">${escapeHTML(item.authors)}</div>` : ''}
        <div class="badge-row">
          <span class="badge">${escapeHTML(item.type || 'Objeto')}</span>
          ${item.status === 'Va y vuelve' ? `<span class="badge loan-badge">Prestado${item.loanedTo ? ` a ${escapeHTML(item.loanedTo)}` : ''}</span>` : ''}
          ${decade ? `<span class="badge">${escapeHTML(decade)}</span>` : ''}
        </div>
        <div class="card-meta">${[item.publisher, item.year].filter(Boolean).map(escapeHTML).join(' · ')}</div>
        <div class="card-foot">${[shortLanguage(item.language), item.guardian].filter(Boolean).map(escapeHTML).join(' · ')}</div>
        <div class="card-actions">
          <button class="action-pill ${item.isGem ? 'active' : ''}" data-action="toggle-gem" data-id="${item.id}">💎 Joyita</button>
          <button class="action-pill ${item.discover ? 'active' : ''}" data-action="toggle-discover" data-id="${item.id}">🧭 Descubrir</button>
          ${item.status === 'Va y vuelve' ? `<button class="action-pill active" data-action="toggle-status" data-id="${item.id}">👜 Va y vuelve</button>` : `<button class="action-pill" data-action="toggle-status" data-id="${item.id}">📚 Biblioteca</button>`}
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
      alert(`Joyitas tiene un límite blando de ${GEM_LIMIT}. Podés seguir, pero conviene cuidar la selección.`);
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
  el.imageInput.value = '';
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

  el.itemModal.classList.remove('hidden');
  el.itemModal.setAttribute('aria-hidden', 'false');
}

function closeItemModal() {
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
  if (item.image) { el.imagePreview.innerHTML = `<img src="${item.image}" alt="Vista previa">`; el.imagePreview.dataset.image = item.image; }
}

async function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const base64 = await fileToBase64(file);
  el.imagePreview.innerHTML = `<img src="${base64}" alt="Vista previa">`;
  el.imagePreview.dataset.image = base64;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = new FormData(el.itemForm);
  const existing = state.editingId ? state.items.find(entry => entry.id === state.editingId) : null;
  const status = form.get('status') || 'Biblioteca';
  const loanedTo = String(form.get('loanedTo') || '').trim();
  const nextItem = {
    id: existing?.id || crypto.randomUUID(),
    title: String(form.get('title') || '').trim(),
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

  save();
  render();
  closeItemModal();
}

function handleDeleteItem() {
  if (!state.editingId) return;
  const confirmed = confirm('¿Eliminar este item? Esta acción no se puede deshacer.');
  if (!confirmed) return;
  state.items = state.items.filter(item => item.id !== state.editingId);
  save();
  render();
  closeItemModal();
}

function openSettingsModal() {
  el.settingsModal.classList.remove('hidden');
  el.settingsModal.setAttribute('aria-hidden', 'false');
}

function closeSettingsModal() {
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
      save();
      render();
      closeSettingsModal();
      alert('Biblioteca importada correctamente.');
    } catch {
      alert('No se pudo importar el archivo JSON.');
    }
  };
  reader.readAsText(file);
}

function resetLibrary() {
  const confirmed = confirm('¿Seguro que querés borrar toda la biblioteca local?');
  if (!confirmed) return;
  state.items = [];
  save();
  render();
  closeSettingsModal();
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
