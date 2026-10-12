/* ==========================================================================
   GameVault — main.js
   Application bootstrap: loads shared chrome, then initializes the active
   view (home / backlog / deals) based on <body data-view="...">.
   ========================================================================== */

import {
  loadHeaderFooter,
  alertMessage,
  getParam,
  escapeHtml,
  openModal,
  ICONS,
} from "./utils.mjs";
import ExternalServices, { GENRE_FILTERS } from "./ExternalServices.mjs";
import GameList from "./GameList.mjs";
import GameDetails from "./GameDetails.mjs";
import BacklogManager from "./BacklogManager.mjs";
import DealFinder from "./DealFinder.mjs";

const body = document.body;
const view = body.dataset.view || "home";
const base = body.dataset.base || ".";

const services = new ExternalServices();

loadHeaderFooter(base, view);

if (services.demoMode) {
  alertMessage(
    'Demo catalog active — open the ⚙ settings menu to add a free RAWG API key for the full live catalog.',
    "info",
    7000
  );
}

/* ==========================================================================
   HOME — search, filter, sort, paginate
   ========================================================================== */

function initHome() {
  const grid = document.getElementById("game-grid");
  const countEl = document.getElementById("results-count");
  const loadMoreBtn = document.getElementById("load-more");
  const searchInput = document.getElementById("header-search-input");
  const genreBox = document.getElementById("genre-filters");
  const filtersPanel = document.getElementById("filters");
  const filtersToggle = document.getElementById("filters-toggle");
  const filtersClose = document.getElementById("filters-close");
  const resetBtn = document.getElementById("filters-reset");
  const sortSelect = document.getElementById("sort-select");
  const ratingSelect = document.getElementById("rating-select");

  const state = {
    query: getParam("q") || "",
    genres: [],
    platform: "all",
    ordering: "-rating",
    minRating: 0,
    page: 1,
    pageSize: 20,
    next: false,
  };

  const details = new GameDetails(services);
  const gameList = new GameList(grid, {
    onSelect: (id) => details.open(id),
  });

  if (searchInput) searchInput.value = state.query;

  /* Static genre checkboxes ------------------------------------------------ */
  if (genreBox) {
    genreBox.innerHTML = GENRE_FILTERS.map(
      (genre) => `
        <label class="check-item">
          <input type="checkbox" name="genre" value="${escapeHtml(genre.slug)}">
          <span>${escapeHtml(genre.name)}</span>
        </label>`
    ).join("");

    genreBox.addEventListener("change", () => {
      state.genres = Array.from(
        genreBox.querySelectorAll('input[name="genre"]:checked')
      ).map((input) => input.value);
      load();
    });
  }

  /* Platform radios -------------------------------------------------------- */
  document.getElementById("platform-filters")?.addEventListener("change", (event) => {
    if (event.target.name !== "platform") return;
    state.platform = event.target.value;
    load();
  });

  sortSelect?.addEventListener("change", () => {
    state.ordering = sortSelect.value;
    load();
  });

  ratingSelect?.addEventListener("change", () => {
    state.minRating = Number(ratingSelect.value);
    load();
  });

  resetBtn?.addEventListener("click", () => {
    state.genres = [];
    state.platform = "all";
    state.ordering = "-rating";
    state.minRating = 0;
    state.query = "";
    if (searchInput) searchInput.value = "";
    genreBox?.querySelectorAll('input[name="genre"]').forEach((input) => {
      input.checked = false;
    });
    const allRadio = document.querySelector('input[name="platform"][value="all"]');
    if (allRadio) allRadio.checked = true;
    if (sortSelect) sortSelect.value = "-rating";
    if (ratingSelect) ratingSelect.value = "0";
    load();
    alertMessage("Filters reset.", "info", 2500);
  });

  filtersToggle?.addEventListener("click", () => {
    if (!filtersPanel) return;
    filtersPanel.hidden = false;
    filtersClose?.focus();
  });

  filtersClose?.addEventListener("click", () => {
    if (filtersPanel) filtersPanel.hidden = true;
    filtersToggle?.focus();
  });

  loadMoreBtn?.addEventListener("click", () => {
    state.page += 1;
    load({ append: true });
  });

  document.addEventListener("gv:search", (event) => {
    state.query = event.detail.query || "";
    if (searchInput) searchInput.value = state.query;
    load();
    document.getElementById("game-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* Initial load ----------------------------------------------------------- */
  async function load({ append = false } = {}) {
    if (append) {
      loadMoreBtn.disabled = true;
    } else {
      state.page = 1;
      gameList.showLoading(8);
      loadMoreBtn.hidden = true;
      if (countEl) countEl.textContent = "Searching…";
    }

    try {
      const { results, next, count } = await services.searchGames({
        query: state.query,
        genres: state.genres,
        platform: state.platform,
        ordering: state.ordering,
        page: state.page,
        pageSize: state.pageSize,
      });

      state.next = next;

      const visible = results.filter(
        (game) => Number(game.rating || 0) >= state.minRating
      );

      if (!visible.length && !append) {
        gameList.showState({
          title: "No games found",
          message: services.demoMode
            ? "The demo catalog has a limited selection. Add a RAWG API key in settings for thousands more."
            : "Try a different search term or loosen your filters.",
        });
      } else {
        gameList.render(visible, { append });
      }

      if (countEl) {
        const shown = gameList.games.length;
        countEl.textContent = state.next
          ? `${shown} of ${count}+ games`
          : `${count} game${count === 1 ? "" : "s"} found`;
      }

      loadMoreBtn.hidden = !state.next;
      loadMoreBtn.disabled = false;
    } catch (error) {
      gameList.showState({
        title: "Something went wrong",
        message: error.message,
        action:
          '<button class="btn btn-primary js-retry" type="button">Try again</button>',
      });
      gameList.container
        .querySelector(".js-retry")
        ?.addEventListener("click", () => load());
      alertMessage(error.message, "error");
      if (countEl) countEl.textContent = "";
      loadMoreBtn.hidden = true;
    }
  }

  load();

  /* Responsive: hide filter panel again when crossing to desktop ----------- */
  const desktop = window.matchMedia("(min-width: 1024px)");
  const syncPanel = () => {
    if (filtersPanel) filtersPanel.hidden = !desktop.matches;
  };
  syncPanel();
  desktop.addEventListener("change", syncPanel);
}

/* ==========================================================================
   BACKLOG — board view, status updates, roulette
   ========================================================================== */

function initBacklog() {
  const board = document.getElementById("backlog-board");
  const summaryEl = document.getElementById("backlog-summary");
  const chipsEl = document.getElementById("status-chips");

  if (!board) return;

  const columns = {};
  BacklogManager.STATUSES.forEach((status) => {
    columns[status] = board.querySelector(`[data-column="${status}"]`);
  });

  function itemMarkup(item) {
    const date = new Date(item.dateAdded).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const thumb = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">`
      : "";

    return `
      <li class="backlog-item" data-item-id="${escapeHtml(item.id)}">
        <div class="backlog-thumb">${thumb}</div>
        <div class="backlog-item-body">
          <span class="backlog-item-title">${escapeHtml(item.title)}</span>
          <span class="backlog-item-meta">Added ${escapeHtml(date)}${
            item.rating ? ` &bull; ${Number(item.rating).toFixed(1)}★` : ""
          }</span>
          <div class="backlog-item-controls">
            <label class="visually-hidden" for="status-${escapeHtml(
              item.id
            )}">Status for ${escapeHtml(item.title)}</label>
            <select class="select js-item-status" id="status-${escapeHtml(item.id)}">
              ${BacklogManager.STATUSES.map(
                (status) =>
                  `<option value="${escapeHtml(status)}"${
                    status === item.status ? " selected" : ""
                  }>${escapeHtml(status)}</option>`
              ).join("")}
            </select>
            <button class="icon-btn js-item-remove" type="button"
                    aria-label="Remove ${escapeHtml(item.title)}" title="Remove">
              ${ICONS.trash}
            </button>
          </div>
        </div>
      </li>`;
  }

  function render() {
    const all = BacklogManager.getAll();
    const counts = BacklogManager.countByStatus();

    if (summaryEl) {
      summaryEl.textContent = all.length
        ? `${all.length} game${all.length === 1 ? "" : "s"} saved in this browser.`
        : "Your backlog is empty — add games from the home page.";
    }

    if (chipsEl) {
      chipsEl.innerHTML = BacklogManager.STATUSES.map(
        (status) => `
          <span class="status-chip" data-status="${escapeHtml(status)}">
            <span class="dot"></span>${escapeHtml(status)}
            <strong>${counts[status]}</strong>
          </span>`
      ).join("");
    }

    BacklogManager.STATUSES.forEach((status) => {
      const column = columns[status];
      if (!column) return;
      const items = all.filter((item) => item.status === status);

      column.querySelector(".board-count").textContent = items.length;
      const list = column.querySelector(".backlog-list");

      list.innerHTML = items.length
        ? items.map(itemMarkup).join("")
        : `<li class="muted" style="font-size:0.86rem;padding:0.4rem 0;">
             Nothing here yet.
           </li>`;

      list.querySelectorAll(".backlog-thumb img").forEach((img) => {
        img.addEventListener("error", () => {
          img.hidden = true;
        });
      });
    });
  }

  board.addEventListener("change", (event) => {
    const select = event.target.closest(".js-item-status");
    if (!select) return;
    const item = select.closest("[data-item-id]");
    BacklogManager.setStatus(item.dataset.itemId, select.value);
    alertMessage(`Moved to ${select.value}.`, "success", 2500);
  });

  board.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".js-item-remove");
    if (!removeBtn) return;
    const item = removeBtn.closest("[data-item-id]");
    const title =
      item.querySelector(".backlog-item-title")?.textContent || "Game";
    BacklogManager.remove(item.dataset.itemId);
    alertMessage(`"${title}" removed from your backlog.`, "info", 3000);
  });

  document.getElementById("clear-all")?.addEventListener("click", () => {
    if (!BacklogManager.getAll().length) {
      alertMessage("Your backlog is already empty.", "info", 2500);
      return;
    }
    if (window.confirm("Remove every game from your backlog?")) {
      BacklogManager.clear();
      alertMessage("Backlog cleared.", "info");
    }
  });

  document.addEventListener("gv:backlog-changed", render);
  render();

  /* Backlog Roulette ------------------------------------------------------- */
  document.getElementById("roulette-btn")?.addEventListener("click", openRoulette);

  function openRoulette() {
    const pool = BacklogManager.getPlanToPlay();
    if (!pool.length) {
      alertMessage(
        'The roulette needs at least one game marked "Plan to Play".',
        "warning"
      );
      return;
    }

    const modal = openModal(`
      <button class="modal-close" type="button" aria-label="Close roulette">&times;</button>
      <div class="settings-body">
        <h2>Backlog Roulette</h2>
        <p class="muted">Spinning through ${pool.length} game${
          pool.length === 1 ? "" : "s"
        } from your Plan to Play list…</p>
        <div class="roulette-stage js-stage">
          <div class="roulette-pick">
            <div class="card-media js-pick-media" style="aspect-ratio:16/9;"></div>
            <div class="roulette-pick-title js-pick-title">…</div>
          </div>
        </div>
        <div class="settings-actions js-roulette-actions" hidden>
          <button class="btn btn-primary js-roulette-play" type="button">
            Start playing this
          </button>
          <button class="btn btn-outline js-roulette-again" type="button">Pick again</button>
        </div>
      </div>`);

    const stage = modal.querySelector(".js-stage");
    const media = modal.querySelector(".js-pick-media");
    const title = modal.querySelector(".js-pick-title");
    const actions = modal.querySelector(".js-roulette-actions");
    let spinTimer = null;

    const showPick = (game) => {
      media.innerHTML = game.image
        ? `<img src="${escapeHtml(game.image)}" alt="">`
        : `<span class="media-fallback">${escapeHtml(game.title)}</span>`;
      title.textContent = game.title;
    };

    const spin = () => {
      actions.hidden = true;
      stage.classList.add("spinning");
      let ticks = 0;
      clearInterval(spinTimer);
      spinTimer = setInterval(() => {
        if (!document.contains(stage)) {
          clearInterval(spinTimer);
          return;
        }
        showPick(pool[Math.floor(Math.random() * pool.length)]);
        ticks += 1;
        if (ticks >= 14) {
          clearInterval(spinTimer);
          const winner = pool[Math.floor(Math.random() * pool.length)];
          showPick(winner);
          stage.classList.remove("spinning");
          actions.hidden = false;
          stage.dataset.winnerId = winner.id;
        }
      }, 140);
    };

    modal.querySelector(".js-roulette-again").addEventListener("click", spin);
    modal.querySelector(".js-roulette-play").addEventListener("click", () => {
      const winner = pool.find(
        (game) => String(game.id) === String(stage.dataset.winnerId)
      );
      if (winner) {
        BacklogManager.setStatus(winner.id, "Currently Playing");
        alertMessage(`"${winner.title}" is now Currently Playing. Have fun!`, "success");
      }
      clearInterval(spinTimer);
    });

    document.addEventListener(
      "gv:modal-closed",
      () => clearInterval(spinTimer),
      { once: true }
    );

    spin();
  }
}

/* ==========================================================================
   DEALS — CheapShark store discounts
   ========================================================================== */

function initDeals() {
  const grid = document.getElementById("deal-grid");
  if (!grid) return;

  const finder = new DealFinder(services, {
    grid,
    storeSelect: document.getElementById("store-select"),
    savingsSelect: document.getElementById("savings-select"),
    sortSelect: document.getElementById("deal-sort"),
    searchInput: document.getElementById("deal-search"),
    loadMoreBtn: document.getElementById("deal-load-more"),
    countEl: document.getElementById("deal-count"),
  });

  finder.init();
}

/* ==========================================================================
   Boot the active view
   ========================================================================== */

switch (view) {
  case "backlog":
    initBacklog();
    break;
  case "deals":
    initDeals();
    break;
  default:
    initHome();
}
