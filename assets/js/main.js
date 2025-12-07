// Sample research data (extended with type/subjects/keywords/link)
const researchData = [
  { id: 1, title: "Neural Network Optimization Techniques", authors: "Smith, J.; Lee, A.", year: 2024,
    type: "Journal", subjects: ["Artificial Intelligence","Computer Science & Engineering"], keywords: ["Neural Networks","Optimization","Deep Learning"],
    abstract: "Exploring novel approaches to optimize deep learning architectures",
    image: "https://unsplash.it/800/450?image=1050", link: "details.html?id=1" },
  { id: 2, title: "5G Network Security Protocols", authors: "Garcia, M.; Patel, R.", year: 2023,
    type: "Conference", subjects: ["Electrical Engineering","Networks"], keywords: ["5G","Security","Protocols"],
    abstract: "Analysis of security vulnerabilities in next-gen networks",
    image: "https://unsplash.it/800/450?image=1039", link: "details.html?id=2" },
  { id: 3, title: "Quantum Encryption Methods", authors: "Chen, L.; Müller, H.", year: 2024,
    type: "Journal", subjects: ["Security","Quantum"], keywords: ["Quantum","Encryption","Post-Quantum"],
    abstract: "Breakthroughs in quantum-resistant encryption algorithms",
    image: "https://unsplash.it/800/450?image=1045", link: "details.html?id=3" },
  { id: 4, title: "Edge Computing Architectures", authors: "Wilson, T.; Kim, Y.", year: 2023,
    type: "Book", subjects: ["IoT","Computer Science & Engineering"], keywords: ["Edge","IoT","Distributed Systems"],
    abstract: "Distributed computing models for IoT environments",
    image: "https://unsplash.it/800/450?image=1027", link: "details.html?id=4" }
];

// Expose for other pages
window.getAllResearchData = () => researchData.slice();

const state = {
  query: "",
  sort: "relevance",
  filters: {
    types: new Set(["Journal","Conference","Book"]),
    subjects: new Set(), // empty = all
    yearFrom: 1900,
    yearTo: 2100
  },
  page: 1,
  pageSize: 6,
  saved: new Set(JSON.parse(localStorage.getItem("savedItems") || "[]"))
};

function persistSaved() {
  localStorage.setItem("savedItems", JSON.stringify([...state.saved]));
  const chip = document.getElementById("savedCount");
  if (chip) chip.textContent = state.saved.size;
}

// Small toast
function toast(msg) {
  let t = document.getElementById("miniToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "miniToast";
    t.style.cssText = "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 14px;border-radius:8px;z-index:1300;box-shadow:0 6px 14px rgba(0,0,0,.2);opacity:0;transition:opacity .2s";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(()=>{ t.style.opacity = "1"; });
  setTimeout(()=>{ t.style.opacity = "0"; }, 1400);
}

// Search/sort/filter pipeline
function applyFilters() {
  const q = state.query.trim().toLowerCase();
  let list = researchData.filter(item => {
    const matchType = state.filters.types.has(item.type);
    const matchYear = item.year >= state.filters.yearFrom && item.year <= state.filters.yearTo;
    const matchSubject = state.filters.subjects.size === 0 || item.subjects.some(s => state.filters.subjects.has(s));
    const hay = (item.title + " " + item.authors + " " + item.abstract + " " + item.keywords.join(" ")).toLowerCase();
    const matchQuery = !q || hay.includes(q);
    return matchType && matchYear && matchSubject && matchQuery;
  });

  switch (state.sort) {
    case "date_desc": list.sort((a,b)=>b.year-a.year); break;
    case "date_asc": list.sort((a,b)=>a.year-b.year); break;
    case "title": list.sort((a,b)=>a.title.localeCompare(b.title)); break;
    default:
      if (q) list.sort((a,b)=>{
        const score = s => (s.title.toLowerCase().includes(q)?3:0)
          + (s.keywords.join(" ").toLowerCase().includes(q)?2:0)
          + (s.abstract.toLowerCase().includes(q)?1:0);
        return score(b)-score(a);
      });
  }
  return list;
}

function paginate(list) {
  const start = (state.page-1)*state.pageSize;
  return list.slice(start, start + state.pageSize);
}

function renderResearchCards() {
  const container = document.getElementById('resultsContainer');
  if (!container) return;

  const all = applyFilters();
  const pageItems = paginate(all);

  const headerCount = container.querySelector(".text-muted");
  if (headerCount) headerCount.textContent = `Showing ${(all.length===0)?0:((state.page-1)*state.pageSize+1)}-${Math.min(state.page*state.pageSize, all.length)} of ${all.length} results`;

  [...container.querySelectorAll(".research-card")].forEach(el => el.remove());

  pageItems.forEach(item => {
    const wrap = document.createElement("div");
    wrap.className = "col-md-6 research-card";
    const saved = state.saved.has(item.id);
    wrap.innerHTML = `
      <div class="card h-100 border-0 shadow-sm">
        <a href="${item.link}" class="text-decoration-none text-dark">
          <img src="${item.image}" class="card-img-top" alt="${item.title}" loading="lazy">
        </a>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex gap-2 align-items-center">
              <span class="badge bg-primary">${item.year}</span>
              <span class="badge bg-secondary">${item.type}</span>
            </div>
            <div class="d-flex align-items-center">
              <button class="btn btn-sm btn-link text-decoration-none text-muted me-2 bookmark-btn" data-id="${item.id}" aria-pressed="${saved}">
                <i class="bi ${saved ? "bi-bookmark-fill" : "bi-bookmark"}"></i>
              </button>
              <button class="btn btn-sm btn-link text-decoration-none text-muted share-btn" data-id="${item.id}" title="Copy link">
                <i class="bi bi-share"></i>
              </button>
            </div>
          </div>
          <a href="${item.link}" class="text-decoration-none"><h3 class="h5 card-title">${item.title}</h3></a>
          <p class="text-muted small mb-1">${item.authors}</p>
          <p class="card-text">${item.abstract}</p>
          <div class="mt-2 d-flex flex-wrap gap-2">
            ${item.keywords.slice(0,3).map(k=>`<span class="badge bg-light text-dark border">${k}</span>`).join("")}
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrap);
  });

  renderPagination(all.length);

  if (window.gsap) {
    try { window.ScrollTrigger && gsap.registerPlugin(ScrollTrigger); } catch {}
    gsap.from('.research-card', { duration: 0.4, y: 24, opacity: 0, stagger: 0.06, ease: "power2.out" });
  }
}

function renderPagination(total) {
  const ul = document.getElementById("pagination");
  if (!ul) return;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, pages);

  ul.innerHTML = "";
  const add = (label, page, disabled=false, active=false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled?"disabled":""} ${active?"active":""}`;
    li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
    if (!disabled) li.addEventListener("click", e => {
      e.preventDefault();
      state.page = page;
      renderResearchCards();
      const top = document.getElementById("resultsContainer")?.offsetTop ?? 0;
      window.scrollTo({ top: Math.max(0, top - 80), behavior: "smooth" });
    });
    ul.appendChild(li);
  };
  add("Previous", Math.max(1, state.page-1), state.page===1, false);
  for (let p=Math.max(1,state.page-1); p<=Math.min(pages, state.page+1); p++) add(String(p), p, false, p===state.page);
  add("Next", Math.min(pages, state.page+1), state.page===pages, false);
}

function initHeaderAnimations() {
  if (!window.gsap) return;
  gsap.from('header', { duration: 0.6, y: -40, opacity: 0, ease: "power2.out" });
}

function initSearchUI() {
  const searchInput = document.querySelector('#searchContainer input');
  const searchBtn = document.getElementById('searchBtn');
  const sortSelect = document.getElementById('sortSelect');

  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      if (window.gsap) gsap.to('#searchContainer', { duration: 0.2, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' });
    });
    searchInput.addEventListener('blur', () => {
      if (window.gsap) gsap.to('#searchContainer', { duration: 0.2, boxShadow: '' });
    });
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(()=>{ state.query = searchInput.value; state.page = 1; renderResearchCards(); }, 200);
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => { state.query = searchInput.value; state.page = 1; renderResearchCards(); });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; renderResearchCards(); });
  }

  // Filters
  const typeBoxes = [
    { id: "journals", type: "Journal" },
    { id: "conferences", type: "Conference" },
    { id: "books", type: "Book" }
  ];
  typeBoxes.forEach(({id,type}) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (el.checked) state.filters.types.add(type); else state.filters.types.delete(type);
      state.page = 1; renderResearchCards();
    });
  });

  const subjectMap = [
    { id: "compEng", label: "Computer Science & Engineering" },
    { id: "elecEng", label: "Electrical Engineering" },
    { id: "ai", label: "Artificial Intelligence" }
  ];
  subjectMap.forEach(({id,label}) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (el.checked) state.filters.subjects.add(label); else state.filters.subjects.delete(label);
      state.page = 1; renderResearchCards();
    });
  });

  const yearFrom = document.getElementById("yearFrom");
  const yearTo = document.getElementById("yearTo");
  const last5 = document.getElementById("last5years");
  const currentYear = document.getElementById("currentYear");
  const applyBtn = [...document.querySelectorAll("button")].find(b => b.textContent?.trim()==="Apply Filters");
  const resetBtn = [...document.querySelectorAll("button")].find(b => b.textContent?.trim()==="Reset All");

  if (yearFrom && yearTo) {
    const syncYears = () => {
      state.filters.yearFrom = Number(yearFrom.value) || 1900;
      state.filters.yearTo = Number(yearTo.value) || 2100;
    };
    yearFrom.addEventListener('change', syncYears);
    yearTo.addEventListener('change', syncYears);
    if (applyBtn) applyBtn.addEventListener('click', ()=>{ syncYears(); state.page=1; renderResearchCards(); });
    if (resetBtn) resetBtn.addEventListener('click', ()=>{
      state.query=""; if (searchInput) searchInput.value="";
      state.sort="relevance"; if (sortSelect) sortSelect.value="relevance";
      state.filters.types = new Set(["Journal","Conference","Book"]);
      typeBoxes.forEach(({id})=>{ const el=document.getElementById(id); if(el) el.checked = (id!=="conferences" && id!=="books"); });
      state.filters.subjects.clear();
      subjectMap.forEach(({id})=>{ const el=document.getElementById(id); if(el) el.checked = (id==="compEng"); if (id==="compEng") state.filters.subjects.add("Computer Science & Engineering"); });
      const now = new Date().getFullYear();
      state.filters.yearFrom = now-5; state.filters.yearTo = now;
      if (yearFrom && yearTo) { yearFrom.value = state.filters.yearFrom; yearTo.value = state.filters.yearTo; }
      if (last5) last5.checked = true;
      if (currentYear) currentYear.checked = false;
      state.page=1; renderResearchCards();
    });
    if (last5) last5.addEventListener('change', ()=>{
      if (!last5.checked) return;
      const now = new Date().getFullYear();
      yearFrom.value = now-5; yearTo.value = now;
      state.filters.yearFrom = now-5; state.filters.yearTo = now;
      if (currentYear) currentYear.checked = false;
      state.page=1; renderResearchCards();
    });
    if (currentYear) currentYear.addEventListener('change', ()=>{
      if (!currentYear.checked) return;
      const now = new Date().getFullYear();
      yearFrom.value = now; yearTo.value = now;
      state.filters.yearFrom = now; state.filters.yearTo = now;
      if (last5) last5.checked = false;
      state.page=1; renderResearchCards();
    });
  }

  // Global click delegation for bookmark/share
  document.addEventListener('click', async (e) => {
    const bm = e.target.closest('.bookmark-btn');
    const sh = e.target.closest('.share-btn');

    if (bm) {
      const id = Number(bm.getAttribute('data-id'));
      if (state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
      persistSaved();
      const i = bm.querySelector('i');
      if (i) i.className = 'bi ' + (state.saved.has(id) ? 'bi-bookmark-fill' : 'bi-bookmark');
      toast(state.saved.has(id) ? "Saved" : "Removed");
    }

    if (sh) {
      const id = Number(sh.getAttribute('data-id'));
      const shareUrl = new URL(location.href);
      shareUrl.pathname = shareUrl.pathname.replace(/index\.html?$/,'') + 'details.html';
      shareUrl.search = `?id=${id}`;
      try { await navigator.clipboard.writeText(shareUrl.toString()); toast("Link copied"); } catch { toast("Copy failed"); }
    }
  });

  // Theme toggle
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn && !themeBtn.dataset.bound) {
    themeBtn.dataset.bound = "1";
    const icon = themeBtn.querySelector('i');
    const applyTheme = (t) => {
      document.body.classList.toggle('dark', t === 'dark');
      if (icon) icon.className = 'bi ' + (t === 'dark' ? 'bi-sun' : 'bi-moon');
    };
    applyTheme(localStorage.getItem('theme') || 'light');
    themeBtn.addEventListener('click', () => {
      const next = document.body.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    });
  }
}

// Render Saved page if present
function renderSavedPage() {
  const savedContainer = document.getElementById("savedContainer");
  if (!savedContainer) return;
  const items = researchData.filter(x => state.saved.has(x.id));
  if (items.length === 0) {
    savedContainer.innerHTML = `<div class="alert alert-info">No saved items yet.</div>`;
    return;
  }
  savedContainer.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "col-md-6";
    div.innerHTML = `
      <div class="card h-100 border-0 shadow-sm">
        <a href="${item.link}" class="text-decoration-none text-dark">
          <img src="${item.image}" class="card-img-top" alt="${item.title}" loading="lazy">
        </a>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="badge bg-primary">${item.year}</span>
              <span class="badge bg-secondary">${item.type}</span>
            </div>
            <button class="btn btn-sm btn-link text-decoration-none text-muted bookmark-btn" data-id="${item.id}">
              <i class="bi bi-bookmark-fill"></i>
            </button>
          </div>
          <a href="${item.link}" class="text-decoration-none"><h3 class="h5 card-title">${item.title}</h3></a>
          <p class="text-muted small mb-1">${item.authors}</p>
          <p class="card-text">${item.abstract}</p>
        </div>
      </div>
    `;
    savedContainer.appendChild(div);
  });
}

// Back to top handler
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const onScroll = () => {
    btn.style.display = window.scrollY > 400 ? 'inline-flex' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();
}

function renderHomeAdditions() {
  // Placeholder for future dynamic loading (kept for extensibility)
  // Could fetch authors/articles/events via API
}
document.addEventListener('DOMContentLoaded', () => {
  initHeaderAnimations();
  initSearchUI();
  persistSaved();
  renderResearchCards();
  renderSavedPage();
  initBackToTop();
  renderHomeAdditions();

  // Newsletter toast
  const nf = document.getElementById('newsletterForm');
  if (nf) nf.addEventListener('submit', e => {
    e.preventDefault();
    toast('Subscribed');
    nf.reset();
  });

  // Create account form validation toast
  const caf = document.getElementById('createAccountForm');
  if (caf) caf.addEventListener('submit', e => {
    e.preventDefault();
    toast('Account created (demo)');
    const modalEl = document.getElementById('createAccountModal');
    if (modalEl && window.bootstrap) window.bootstrap.Modal.getInstance(modalEl)?.hide();
    caf.reset();
  });
});