
const STORAGE_KEYS = ["xanadu_modular_v1", "xanadu_final_rearmado_v1", "xanadu_visual_v2", "xanadu", "xanadu_web_minima_v1"];
const VIEWS = ["Biblioteca", "Joyitas", "A descubrir", "Va y vuelve"];
const SORTS = ["Recientes", "Año", "Autor"];
const DECADES = ["Todas", "2020", "2010", "2000", "1990", "1980"];
const LANGS = ["Todos", "ES", "EN", "FR", "Otros"];

const state = { view:"Biblioteca", sort:"Recientes", decade:"Todas", language:"Todos", search:"" };

const els = {
  viewChips: document.getElementById("viewChips"),
  sortChips: document.getElementById("sortChips"),
  decadeChips: document.getElementById("decadeChips"),
  languageChips: document.getElementById("languageChips"),
  searchInput: document.getElementById("searchInput"),
  screenTitle: document.getElementById("screenTitle"),
  screenSubtitle: document.getElementById("screenSubtitle"),
  currentViewPill: document.getElementById("currentViewPill"),
  countValue: document.getElementById("countValue"),
  cardsGrid: document.getElementById("cardsGrid"),
  emptyState: document.getElementById("emptyState"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  fabAdd: document.getElementById("fabAdd"),
  mobileAddBtn: document.getElementById("mobileAddBtn"),
  mobileViewBtn: document.getElementById("mobileViewBtn"),
  mobileSearchBtn: document.getElementById("mobileSearchBtn"),
  formOverlay: document.getElementById("formOverlay"),
  detailOverlay: document.getElementById("detailOverlay"),
  formTitle: document.getElementById("formTitle"),
  closeFormBtn: document.getElementById("closeFormBtn"),
  cancelFormBtn: document.getElementById("cancelFormBtn"),
  itemForm: document.getElementById("itemForm"),
  editingId: document.getElementById("editingId"),
  status: document.getElementById("status"),
  loanToField: document.getElementById("loanToField"),
  loanedTo: document.getElementById("loanedTo"),
  imageInput: document.getElementById("imageInput"),
  uploadPreview: document.getElementById("uploadPreview"),
  previewImg: document.getElementById("previewImg"),
  closeDetailBtn: document.getElementById("closeDetailBtn"),
  detailCover: document.getElementById("detailCover"),
  detailTitle: document.getElementById("detailTitle"),
  detailSubtitle: document.getElementById("detailSubtitle"),
  detailAuthors: document.getElementById("detailAuthors"),
  detailBadges: document.getElementById("detailBadges"),
  detailMeta: document.getElementById("detailMeta"),
  detailNotes: document.getElementById("detailNotes"),
  detailLoanBlock: document.getElementById("detailLoanBlock"),
  detailLoanCurrent: document.getElementById("detailLoanCurrent"),
  detailHistory: document.getElementById("detailHistory"),
  editBtn: document.getElementById("editBtn"),
  toggleLoanBtn: document.getElementById("toggleLoanBtn"),
  deleteBtn: document.getElementById("deleteBtn")
};

let books = [];
let lastGuardian = "";
let pendingImage = "";
let selectedId = null;

function uid(){ return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36); }
function compact(arr){ return arr.filter(Boolean); }
function escapeHtml(v){
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function norm(v){ return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
function decadeOf(year){ const n=parseInt(year,10); return n ? String(Math.floor(n/10)*10) : ""; }
function languageCode(v){
  const x=norm(v);
  if(!x) return "Otros";
  if(x.startsWith("es")||x.includes("castell")) return "ES";
  if(x.startsWith("en")||x.includes("ingles")) return "EN";
  if(x.startsWith("fr")||x.includes("frances")) return "FR";
  return "Otros";
}
function fmtDate(ts){ return new Date(ts||Date.now()).toLocaleDateString("es-AR"); }

function sanitizeBook(raw){
  const book = { ...raw };
  book.id = String(book.id || uid());
  book.title = String(book.title || "").trim();
  book.subtitle = String(book.subtitle || "").trim();
  book.authors = String(book.authors || book.author || "").trim();
  book.type = String(book.type || "Libro").trim() || "Libro";
  book.status = ["Biblioteca", "Va y vuelve"].includes(book.status) ? book.status : "Biblioteca";
  book.publisher = String(book.publisher || "").trim();
  book.genre = String(book.genre || "").trim();
  book.year = String(book.year || "").trim();
  book.language = String(book.language || "Español").trim() || "Español";
  book.guardian = String(book.guardian || "").trim();
  book.notes = String(book.notes || "").trim();
  book.image = String(book.image || book.cover || "").trim();
  book.isGem = !!book.isGem || book.status === "Joyitas";
  book.discover = !!book.discover || book.status === "A descubrir";
  book.createdAt = Number(book.createdAt || Date.now());
  book.loanedTo = String(book.loanedTo || "").trim();
  const history = Array.isArray(book.loanHistory) ? book.loanHistory : [];
  book.loanHistory = history.map(entry => ({
    to:String(entry.to || entry.loanedTo || "").trim(),
    date:Number(entry.date || Date.now())
  })).filter(entry => entry.to);
  return book;
}

function defaultBooks(){
  return [
    { id:uid(), title:"Watchmen", subtitle:"", authors:"Alan Moore y Dave Gibbons", type:"Comic", status:"Biblioteca", publisher:"Planeta", genre:"Novela gráfica", year:"2008", language:"Español", guardian:"Luciano", notes:"", image:"", isGem:false, discover:false, createdAt:Date.now()-20000, loanedTo:"", loanHistory:[] },
    { id:uid(), title:"1984", subtitle:"", authors:"George Orwell", type:"Libro", status:"Biblioteca", publisher:"Debolsillo", genre:"Novela", year:"1984", language:"Español", guardian:"Luciano", notes:"", image:"", isGem:false, discover:true, createdAt:Date.now()-10000, loanedTo:"", loanHistory:[] }
  ];
}

function loadBooks(){
  for(const key of STORAGE_KEYS){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) continue;
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed.map(sanitizeBook);
      if(Array.isArray(parsed.books)) return parsed.books.map(sanitizeBook);
    }catch{}
  }
  return defaultBooks();
}

function saveBooks(){
  localStorage.setItem(STORAGE_KEYS[0], JSON.stringify({ books }));
}

function renderChipSet(container, items, active, onSelect){
  container.innerHTML = items.map(item => `<button class="chip ${item===active?"active":""}" type="button" data-value="${item}">${item}</button>`).join("");
  [...container.querySelectorAll("button")].forEach(btn => btn.addEventListener("click", () => onSelect(btn.dataset.value)));
}

function visibleBooks(){
  let list = books.filter(book => {
    if(state.view === "Joyitas") return !!book.isGem;
    if(state.view === "A descubrir") return !!book.discover;
    if(state.view === "Va y vuelve") return book.status === "Va y vuelve";
    return book.status === "Biblioteca";
  });

  if(state.decade !== "Todas") list = list.filter(book => decadeOf(book.year) === state.decade);
  if(state.language !== "Todos") list = list.filter(book => languageCode(book.language) === state.language);
  if(state.search){
    const q = norm(state.search);
    list = list.filter(book => norm([
      book.title, book.subtitle, book.authors, book.publisher, book.genre,
      book.language, book.guardian, book.notes, book.loanedTo, book.year
    ].join(" ")).includes(q));
  }

  list = list.slice();
  if(state.sort === "Recientes") list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  if(state.sort === "Año") list.sort((a,b)=>Number(b.year||0)-Number(a.year||0));
  if(state.sort === "Autor") list.sort((a,b)=>(a.authors||"").localeCompare(b.authors||"","es"));
  return list;
}

function subtitleForView(){
  if(state.view === "Joyitas") return "Selección curada manualmente.";
  if(state.view === "A descubrir") return "Libros y materiales para seguir de cerca.";
  if(state.view === "Va y vuelve") return "Ítems prestados y su memoria de circulación.";
  if(state.sort === "Año") return "Ordenados por año.";
  if(state.sort === "Autor") return "Ordenados por autor.";
  return "Últimos añadidos primero.";
}

function render(){
  renderChipSet(els.viewChips, VIEWS, state.view, value => { state.view = value; render(); });
  renderChipSet(els.sortChips, SORTS, state.sort, value => { state.sort = value; render(); });
  renderChipSet(els.decadeChips, DECADES, state.decade, value => { state.decade = value; render(); });
  renderChipSet(els.languageChips, LANGS, state.language, value => { state.language = value; render(); });

  const list = visibleBooks();
  els.screenTitle.textContent = state.view;
  els.screenSubtitle.textContent = subtitleForView();
  els.currentViewPill.textContent = state.view;
  els.mobileViewBtn.textContent = state.view;
  els.countValue.textContent = String(list.length);

  els.cardsGrid.innerHTML = list.map(book => `
    <article class="card" data-open="${book.id}">
      <div class="cover">
        ${book.image ? `<img src="${book.image}" alt="${escapeHtml(book.title)}">` : `<div class="cover-placeholder">${escapeHtml(book.title)}</div>`}
      </div>
      <div class="card-body">
        <h3 class="item-title">${escapeHtml(book.title)}</h3>
        ${book.subtitle ? `<div class="item-subtitle">${escapeHtml(book.subtitle)}</div>` : ""}
        <p class="item-authors">${escapeHtml(book.authors || "")}</p>
        <div class="type-badge">${escapeHtml(book.type)}</div>
        <div class="card-meta">${escapeHtml(compact([book.publisher, book.year]).join(" · "))}</div>
        <div class="card-meta">${escapeHtml(compact([book.language, book.guardian ? `Guardián: ${book.guardian}` : ""]).join(" · "))}</div>
        ${book.loanedTo ? `<div class="loan-tag">Prestado a ${escapeHtml(book.loanedTo)}</div>` : ""}
        ${book.loanHistory && book.loanHistory.length ? `<div class="history-preview">Historial: ${escapeHtml(book.loanHistory[0].to)} · ${escapeHtml(fmtDate(book.loanHistory[0].date))}</div>` : ""}
        <div class="bottom-row">
          <div class="mark-actions">
            <button type="button" class="mark-btn ${book.isGem ? "active" : ""}" data-gem="${book.id}">💎</button>
            <button type="button" class="mark-btn discover ${book.discover ? "active" : ""}" data-discover="${book.id}">🧭</button>
          </div>
          <div class="status-badge">${escapeHtml(book.status)}</div>
        </div>
      </div>
    </article>
  `).join("");

  els.emptyState.classList.toggle("hidden", list.length > 0);
  bindCardEvents();
  saveBooks();
}

function bindCardEvents(){
  [...document.querySelectorAll("[data-open]")].forEach(card => {
    card.addEventListener("click", e => {
      if(e.target.closest("[data-gem]") || e.target.closest("[data-discover]")) return;
      openDetail(card.dataset.open);
    });
  });

  [...document.querySelectorAll("[data-gem]")].forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const book = books.find(b => b.id === btn.dataset.gem);
      if(!book) return;
      if(!book.isGem && books.filter(x => x.isGem).length >= 12){
        alert("Joyitas tiene un límite blando de 12. Sacá una antes de agregar otra.");
        return;
      }
      book.isGem = !book.isGem;
      render();
    });
  });

  [...document.querySelectorAll("[data-discover]")].forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const book = books.find(b => b.id === btn.dataset.discover);
      if(!book) return;
      book.discover = !book.discover;
      render();
    });
  });
}

function setValue(id, value){ document.getElementById(id).value = value || ""; }
function toggleLoanField(){ els.loanToField.classList.toggle("hidden", els.status.value !== "Va y vuelve"); }

function openForm(book = null){
  els.formOverlay.classList.remove("hidden");
  if(!book){
    els.formTitle.textContent = "Agregar";
    els.itemForm.reset();
    els.editingId.value = "";
    document.getElementById("language").value = "Español";
    document.getElementById("guardian").value = lastGuardian || "";
    els.status.value = "Biblioteca";
    pendingImage = "";
    els.uploadPreview.classList.add("hidden");
    toggleLoanField();
    return;
  }
  els.formTitle.textContent = "Editar";
  els.editingId.value = book.id;
  setValue("title", book.title);
  setValue("subtitle", book.subtitle);
  setValue("authors", book.authors);
  setValue("type", book.type);
  setValue("status", book.status);
  setValue("publisher", book.publisher);
  setValue("genre", book.genre);
  setValue("year", book.year);
  setValue("language", book.language || "Español");
  setValue("guardian", book.guardian || lastGuardian || "");
  setValue("loanedTo", book.loanedTo || "");
  setValue("notes", book.notes);
  pendingImage = book.image || "";
  if(pendingImage){
    els.previewImg.src = pendingImage;
    els.uploadPreview.classList.remove("hidden");
  } else {
    els.uploadPreview.classList.add("hidden");
  }
  toggleLoanField();
}

function closeForm(){ els.formOverlay.classList.add("hidden"); }
function closeDetail(){ els.detailOverlay.classList.add("hidden"); selectedId = null; }

function openDetail(id){
  const book = books.find(b => b.id === id);
  if(!book) return;
  selectedId = id;
  els.detailOverlay.classList.remove("hidden");
  els.detailCover.innerHTML = book.image ? `<img src="${book.image}" alt="${escapeHtml(book.title)}">` : `<div class="detail-placeholder">${escapeHtml(book.title)}</div>`;
  els.detailTitle.textContent = book.title || "";
  if(book.subtitle){
    els.detailSubtitle.textContent = book.subtitle;
    els.detailSubtitle.classList.remove("hidden");
  } else {
    els.detailSubtitle.classList.add("hidden");
  }
  els.detailAuthors.textContent = book.authors || "";
  els.detailBadges.innerHTML = `
    <span class="type-badge">${escapeHtml(book.type)}</span>
    ${book.isGem ? `<span class="status-badge">💎 Joyita</span>` : ""}
    ${book.discover ? `<span class="status-badge">🧭 A descubrir</span>` : ""}
    <span class="status-badge">${escapeHtml(book.status)}</span>
  `;
  els.detailMeta.textContent = compact([book.publisher, book.genre, book.year, book.language, book.guardian ? `Guardián: ${book.guardian}` : ""]).join(" · ");
  els.detailNotes.textContent = book.notes || "Sin notas.";
  const showLoan = (book.loanHistory && book.loanHistory.length) || book.status === "Va y vuelve" || book.loanedTo;
  els.detailLoanBlock.classList.toggle("hidden", !showLoan);
  els.detailLoanCurrent.textContent = book.status === "Va y vuelve"
    ? (book.loanedTo ? `Actualmente prestado a ${book.loanedTo}.` : "Está en va y vuelve, sin destinatario cargado.")
    : "Actualmente no está prestado.";
  els.detailHistory.innerHTML = (book.loanHistory && book.loanHistory.length)
    ? book.loanHistory.map(entry => `<li class="history-item">${escapeHtml(entry.to)} · ${escapeHtml(new Date(entry.date).toLocaleDateString("es-AR"))}</li>`).join("")
    : `<li class="history-item">Sin historial todavía.</li>`;
}

function addLoanHistory(book, to){
  if(!to) return;
  if(!Array.isArray(book.loanHistory)) book.loanHistory = [];
  book.loanHistory.unshift({ to, date: Date.now() });
}

function toggleLoanFromDetail(){
  const book = books.find(b => b.id === selectedId);
  if(!book) return;
  if(book.status === "Va y vuelve"){
    book.status = "Biblioteca";
    book.loanedTo = "";
  } else {
    const to = prompt("¿A quién se presta?");
    if(to === null) return;
    const clean = to.trim();
    book.status = "Va y vuelve";
    book.loanedTo = clean;
    addLoanHistory(book, clean);
  }
  render();
  openDetail(book.id);
}

function deleteSelected(){
  const book = books.find(b => b.id === selectedId);
  if(!book) return;
  if(!confirm(`¿Borrar "${book.title}"?`)) return;
  books = books.filter(b => b.id !== selectedId);
  closeDetail();
  render();
}

async function fileToDataURL(file){
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

els.imageInput.addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if(!file) return;
  pendingImage = await fileToDataURL(file);
  els.previewImg.src = pendingImage;
  els.uploadPreview.classList.remove("hidden");
});

els.status.addEventListener("change", toggleLoanField);

els.itemForm.addEventListener("submit", e => {
  e.preventDefault();
  const existing = books.find(b => b.id === els.editingId.value);
  const status = els.status.value;
  const loanedTo = (els.loanedTo.value || "").trim();
  const book = existing ? { ...existing } : { id: uid(), isGem:false, discover:false, loanHistory:[], createdAt:Date.now() };

  book.title = document.getElementById("title").value.trim();
  book.subtitle = document.getElementById("subtitle").value.trim();
  book.authors = document.getElementById("authors").value.trim();
  book.type = document.getElementById("type").value;
  book.status = status;
  book.publisher = document.getElementById("publisher").value.trim();
  book.genre = document.getElementById("genre").value.trim();
  book.year = document.getElementById("year").value.trim();
  book.language = document.getElementById("language").value.trim() || "Español";
  book.guardian = document.getElementById("guardian").value.trim() || lastGuardian || "";
  book.notes = document.getElementById("notes").value.trim();
  book.image = pendingImage || existing?.image || "";

  const prevStatus = existing?.status || "";
  const prevLoanedTo = existing?.loanedTo || "";

  if(status === "Va y vuelve"){
    book.loanedTo = loanedTo;
    if((!existing && loanedTo) || (prevStatus !== "Va y vuelve" && loanedTo) || (prevStatus === "Va y vuelve" && loanedTo && loanedTo !== prevLoanedTo)){
      addLoanHistory(book, loanedTo);
    }
  } else {
    book.loanedTo = "";
  }

  if(!book.title) return;
  lastGuardian = book.guardian || lastGuardian;

  if(existing){
    books = books.map(b => b.id === book.id ? sanitizeBook(book) : b);
  } else {
    books.unshift(sanitizeBook(book));
  }

  closeForm();
  render();
  if(selectedId === book.id) openDetail(book.id);
});

els.fabAdd.addEventListener("click", () => openForm());
els.mobileAddBtn.addEventListener("click", () => openForm());
els.closeFormBtn.addEventListener("click", closeForm);
els.cancelFormBtn.addEventListener("click", closeForm);
els.closeDetailBtn.addEventListener("click", closeDetail);
els.editBtn.addEventListener("click", () => {
  const book = books.find(b => b.id === selectedId);
  if(!book) return;
  closeDetail();
  openForm(book);
});
els.toggleLoanBtn.addEventListener("click", toggleLoanFromDetail);
els.deleteBtn.addEventListener("click", deleteSelected);

els.searchInput.addEventListener("input", e => { state.search = e.target.value; render(); });
els.mobileSearchBtn.addEventListener("click", () => {
  els.searchInput.focus();
  window.scrollTo({ top:0, behavior:"smooth" });
});
els.mobileViewBtn.addEventListener("click", () => {
  const idx = VIEWS.indexOf(state.view);
  state.view = VIEWS[(idx + 1) % VIEWS.length];
  render();
});

els.exportBtn.addEventListener("click", () => {
  const payload = { books, exportedAt:new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xanadu-export.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

els.importBtn.addEventListener("click", () => els.importFile.click());
els.importFile.addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    const imported = Array.isArray(data) ? data : data.books;
    if(!Array.isArray(imported)) throw new Error("Formato inválido");
    books = imported.map(sanitizeBook).filter(book => book.title);
    saveBooks();
    render();
  }catch{
    alert("No se pudo importar el JSON.");
  }
  e.target.value = "";
});

window.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    closeForm();
    closeDetail();
  }
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

books = loadBooks();
lastGuardian = books.map(b => b.guardian).filter(Boolean).pop() || "";
render();
