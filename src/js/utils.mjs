/* ==========================================================================
   GameVault — utils.mjs
   Helpers: storage, alerts, modal shell, theme, header/footer, formatting
   ========================================================================== */

export const KEYS = {
  backlog: "gamevault-backlog",
  theme: "gamevault-theme",
  apiKey: "gamevault-rawg-key",
};

export const STATUSES = ["Plan to Play", "Currently Playing", "Completed"];

/* --------------------------------------------------------------------------
   Storage
   -------------------------------------------------------------------------- */

export function getLocalStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read localStorage key "${key}"`, err);
    return fallback;
  }
}

export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Could not write localStorage key "${key}"`, err);
    return false;
  }
}

/* --------------------------------------------------------------------------
   URL params
   -------------------------------------------------------------------------- */

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function formatDate(iso) {
  if (!iso) return "TBA";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPrice(price) {
  const num = Number(price);
  if (Number.isNaN(num)) return "$--";
  return `$${num.toFixed(2)}`;
}

export function el(tag, className = "", html = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

/* --------------------------------------------------------------------------
   Inline SVG icons
   -------------------------------------------------------------------------- */

export const ICONS = {
  logo: `<svg class="brand-logo" viewBox="0 0 48 48" role="img" aria-label="GameVault logo" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 3 42 9v16c0 11.5-7.6 18.4-18 21C13.6 43.4 6 36.5 6 25V9L24 3z" fill="#4c1d95" stroke="#6366f1" stroke-width="2"/>
      <path d="M16 21h16a7 7 0 0 1 6.9 8.1l-.7 4.2A4 4 0 0 1 34.3 36c-1.3 0-2.5-.7-3.2-1.8L29.4 33H18.6l-1.7 1.2A4 4 0 0 1 13.7 36a4 4 0 0 1-3.9-2.7l-.7-4.2A7 7 0 0 1 16 21z" fill="#f8fafc"/>
      <circle cx="17.5" cy="27" r="1.8" fill="#4c1d95"/>
      <path d="M31 25.6v4M29 27.6h4" stroke="#4c1d95" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M34 8h9l3 5-4.5 6.5-4-2.5-5.5 1L34 8z" fill="#22c55e" stroke="#052e16" stroke-width="1.4"/>
      <circle cx="38.5" cy="11.5" r="1.3" fill="#052e16"/>
    </svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/><path d="M10 21v-6h4v6"/></svg>`,
  library: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16.5 5 3.8 1-3 14.7-3.9-1z"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 12 4.8V3H4v8h1.8l8.6 8.6a2 2 0 0 0 2.8 0l3.4-3.4a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 7V4.5h4V7M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>`,
  dice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.7" cy="8.7" r="1.4" fill="currentColor"/><circle cx="15.3" cy="15.3" r="1.4" fill="currentColor"/><circle cx="15.3" cy="8.7" r="1.4" fill="currentColor"/><circle cx="8.7" cy="15.3" r="1.4" fill="currentColor"/></svg>`,
  gamepad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 8h10a5 5 0 0 1 4.9 5.9l-.6 3.4A3 3 0 0 1 16.4 19a3 3 0 0 1-2.2-1l-.7-.8H10.5l-.7.8a3 3 0 0 1-2.2 1 3 3 0 0 1-4.9-1.7l-.6-3.4A5 5 0 0 1 7 8z"/><path d="M8 12v3M6.5 13.5h3"/><circle cx="16" cy="12.7" r="1" fill="currentColor"/><circle cx="17.8" cy="14.5" r="1" fill="currentColor"/></svg>`,
};

export function starIcon() {
  return ICONS.star;
}

/* --------------------------------------------------------------------------
   Alert banners
   -------------------------------------------------------------------------- */

export function alertMessage(message, type = "info", duration = 4500) {
  const region = document.getElementById("alert-region");
  if (!region) return;

  const alert = el("div", `alert alert-${type}`);
  alert.setAttribute("role", type === "error" ? "alert" : "status");
  alert.innerHTML = `<span class="alert-msg"></span>
    <button class="alert-close" type="button" aria-label="Dismiss">&times;</button>`;
  alert.querySelector(".alert-msg").textContent = message;

  const remove = () => {
    alert.style.opacity = "0";
    setTimeout(() => alert.remove(), 200);
  };
  alert.querySelector(".alert-close").addEventListener("click", remove);
  region.appendChild(alert);
  if (duration > 0) setTimeout(remove, duration);
}

/* --------------------------------------------------------------------------
   Modal shell (single active modal)
   -------------------------------------------------------------------------- */

let activeModal = null;

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeModal) closeModal();
});

export function openModal(inner, { size = "" } = {}) {
  closeModal(true);

  const backdrop = el("div", "modal-backdrop");
  const modal = el("div", `modal${size === "sm" ? " modal-sm" : ""}`);
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  if (typeof inner === "string") modal.innerHTML = inner;
  else modal.appendChild(inner);

  backdrop.appendChild(modal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest(".modal-close")) closeModal();
  });
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  activeModal = backdrop;
  const focusable = modal.querySelector("button, [href], input, select, textarea");
  if (focusable) focusable.focus();
  return modal;
}

export function closeModal(silent = false) {
  if (!activeModal) return;
  activeModal.remove();
  activeModal = null;
  document.body.style.overflow = "";
  if (!silent) document.dispatchEvent(new CustomEvent("gv:modal-closed"));
}

export function isModalOpen() {
  return Boolean(activeModal);
}

/* --------------------------------------------------------------------------
   Theme
   -------------------------------------------------------------------------- */

export function applyTheme(theme) {
  const valid = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = valid;
  setLocalStorage(KEYS.theme, valid);
  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.innerHTML = valid === "dark" ? ICONS.sun : ICONS.moon;
    btn.setAttribute(
      "aria-label",
      valid === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  });
}

export function initTheme() {
  const saved = getLocalStorage(KEYS.theme, "dark");
  applyTheme(saved);
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
}

/* --------------------------------------------------------------------------
   Backlog badge counts
   -------------------------------------------------------------------------- */

export function backlogCount() {
  const backlog = getLocalStorage(KEYS.backlog, []);
  return Array.isArray(backlog) ? backlog.length : 0;
}

export function renderBacklogBadge() {
  const count = backlogCount();
  document.querySelectorAll(".js-backlog-count").forEach((badge) => {
    badge.textContent = count > 0 ? String(count) : "";
    badge.dataset.count = String(count);
  });
}

/* --------------------------------------------------------------------------
   Settings modal (RAWG API key)
   -------------------------------------------------------------------------- */

export function hasApiKey() {
  return Boolean(getLocalStorage(KEYS.apiKey, ""));
}

function openSettingsModal() {
  const current = getLocalStorage(KEYS.apiKey, "");
  const modal = openModal(
    `<button class="modal-close" type="button" aria-label="Close settings">&times;</button>
     <div class="settings-body">
       <h2>API settings</h2>
       <p>GameVault uses the free
         <a href="https://rawg.io/apis" target="_blank" rel="noopener">RAWG API</a>
         for its full game catalog. Paste your key below — it is stored only in this
         browser (localStorage) and never leaves your device except to call RAWG.</p>
       <div class="field">
         <label class="field-label" for="api-key-input">RAWG API key</label>
         <input class="input" id="api-key-input" type="text" autocomplete="off"
                spellcheck="false" placeholder="e.g. 5b3f...a91c" value="${escapeHtml(current)}">
       </div>
       <p id="key-status" class="muted">${
         current ? "Key saved. Live catalog is active." : "No key yet — demo catalog is active."
       }</p>
       <div class="settings-actions">
         <button class="btn btn-primary js-save-key" type="button">Save key</button>
         <button class="btn btn-danger js-clear-key" type="button" ${current ? "" : "hidden"}>Remove key</button>
       </div>
     </div>`,
    { size: "sm" }
  );

  const input = modal.querySelector("#api-key-input");
  const status = modal.querySelector("#key-status");

  modal.querySelector(".js-save-key").addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) {
      alertMessage("Enter a RAWG API key first.", "warning");
      return;
    }
    setLocalStorage(KEYS.apiKey, value);
    status.textContent = "Key saved. Live catalog is active.";
    alertMessage("API key saved. Reloading catalog…", "success");
    setTimeout(() => window.location.reload(), 700);
  });

  modal.querySelector(".js-clear-key").addEventListener("click", () => {
    setLocalStorage(KEYS.apiKey, "");
    status.textContent = "No key yet — demo catalog is active.";
    input.value = "";
    alertMessage("API key removed. Switching to demo catalog.", "info");
    setTimeout(() => window.location.reload(), 700);
  });
}

/* --------------------------------------------------------------------------
   Header + footer + drawer + bottom nav
   -------------------------------------------------------------------------- */

function navItems(base, view) {
  return [
    { key: "home", label: "Home", href: `${base}/index.html`, icon: ICONS.home },
    { key: "backlog", label: "Backlog", href: `${base}/backlog/index.html`, icon: ICONS.library },
    { key: "deals", label: "Deals", href: `${base}/deals/index.html`, icon: ICONS.tag },
  ].map(
    (item) =>
      `<a href="${item.href}" class="${view === item.key ? "active" : ""}"${
        view === item.key ? ' aria-current="page"' : ""
      }>${item.icon}<span>${item.label}</span>${
        item.key === "backlog"
          ? '<span class="nav-count js-backlog-count" data-count="0"></span>'
          : ""
      }</a>`
  );
}

function bottomNavItem(base, view, item) {
  return `<a href="${item.href}" class="${view === item.key ? "active" : ""}"${
    view === item.key ? ' aria-current="page"' : ""
  }>
      ${item.icon}
      ${
        item.key === "backlog"
          ? '<span class="bottom-badge js-backlog-count" data-count="0"></span>'
          : ""
      }
      <span>${item.label}</span>
    </a>`;
}

export function loadHeaderFooter(base = ".", view = "home") {
  const items = [
    { key: "home", label: "Home", href: `${base}/index.html`, icon: ICONS.home },
    { key: "backlog", label: "Backlog", href: `${base}/backlog/index.html`, icon: ICONS.library },
    { key: "deals", label: "Deals", href: `${base}/deals/index.html`, icon: ICONS.tag },
  ];

  const headerRoot = document.getElementById("header-root");
  const footerRoot = document.getElementById("footer-root");

  if (headerRoot) {
    headerRoot.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <button class="icon-btn menu-btn js-menu-open" type="button" aria-label="Open menu" aria-expanded="false">
            ${ICONS.menu}
          </button>
          <a class="brand" href="${base}/index.html">
            ${ICONS.logo}
            <span>GAME<em>VAULT</em></span>
          </a>
          <form class="header-search js-search-form" role="search">
            <label class="visually-hidden" for="header-search-input">Search games</label>
            <input class="input" id="header-search-input" name="q" type="search"
                   placeholder="Search games…" autocomplete="off">
            <button class="btn btn-primary" type="submit" aria-label="Search">
              ${ICONS.search}<span class="search-label">Search</span>
            </button>
          </form>
          <nav class="main-nav" aria-label="Primary">
            ${navItems(base, view)}
          </nav>
          <div class="header-actions">
            <button class="icon-btn js-theme-toggle" type="button" aria-label="Toggle theme"></button>
            <button class="icon-btn js-settings-open" type="button" aria-label="API settings">
              ${ICONS.gear}
            </button>
          </div>
        </div>
      </header>

      <div class="drawer-overlay js-drawer-overlay"></div>
      <aside class="drawer js-drawer" aria-label="Mobile menu">
        <div class="drawer-head">
          <a class="brand" href="${base}/index.html">
            ${ICONS.logo}
            <span>GAME<em>VAULT</em></span>
          </a>
          <button class="icon-btn js-menu-close" type="button" aria-label="Close menu">
            ${ICONS.close}
          </button>
        </div>
        <nav>${navItems(base, view)}</nav>
        <div class="drawer-actions">
          <button class="btn btn-outline btn-block js-theme-toggle" type="button">Toggle theme</button>
          <button class="btn btn-outline btn-block js-settings-open" type="button">API settings</button>
        </div>
      </aside>

      <nav class="bottom-nav" aria-label="Mobile primary">
        ${items.map((item) => bottomNavItem(base, view, item)).join("")}
      </nav>`;
  }

  if (footerRoot) {
    footerRoot.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <p>GameVault &copy; 2026 — track your backlog, catch the deals.</p>
          <div class="footer-links">
            <a href="https://rawg.io" target="_blank" rel="noopener">Data: RAWG</a>
            <a href="https://www.cheapshark.com" target="_blank" rel="noopener">Deals: CheapShark</a>
            <a href="${base}/backlog/index.html">My Backlog</a>
          </div>
        </div>
      </footer>`;
  }

  /* Behaviour -------------------------------------------------------------- */

  const drawer = document.querySelector(".js-drawer");
  const overlay = document.querySelector(".js-drawer-overlay");
  const menuBtn = document.querySelector(".js-menu-open");

  const setDrawer = (open) => {
    drawer?.classList.toggle("open", open);
    overlay?.classList.toggle("open", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", String(open));
    if (open) drawer?.querySelector("a")?.focus();
  };

  menuBtn?.addEventListener("click", () => setDrawer(true));
  document.querySelector(".js-menu-close")?.addEventListener("click", () => setDrawer(false));
  overlay?.addEventListener("click", () => setDrawer(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setDrawer(false);
  });

  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });

  document.querySelectorAll(".js-settings-open").forEach((btn) => {
    btn.addEventListener("click", openSettingsModal);
  });

  const searchForm = document.querySelector(".js-search-form");
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchForm.querySelector("input").value.trim();
    if (view === "home") {
      document.dispatchEvent(new CustomEvent("gv:search", { detail: { query } }));
    } else {
      window.location.href = `${base}/index.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    }
  });

  document.addEventListener("gv:backlog-changed", renderBacklogBadge);
  renderBacklogBadge();
  initTheme();
}
