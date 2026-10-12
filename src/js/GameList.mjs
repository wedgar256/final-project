/* ==========================================================================
   GameVault — GameList.mjs
   ES6 class that renders game card templates and handles card actions
   (view details / add to backlog) via event delegation.
   ========================================================================== */

import { ICONS, escapeHtml, alertMessage } from "./utils.mjs";
import BacklogManager from "./BacklogManager.mjs";

function mediaMarkup(game) {
  const image = game.background_image
    ? `<img src="${escapeHtml(game.background_image)}" alt="${escapeHtml(game.name)} cover"
            loading="lazy" decoding="async">`
    : "";
  return `
    <div class="card-media">
      ${image}
      <span class="media-fallback" hidden>${escapeHtml(game.name)}</span>
      ${
        game.rating
          ? `<span class="card-rating">${ICONS.star}${Number(game.rating).toFixed(1)}</span>`
          : ""
      }
      ${
        game.metacritic
          ? `<span class="card-metacritic" title="Metacritic score">${game.metacritic}</span>`
          : ""
      }
    </div>`;
}

function cardMarkup(game) {
  const genres = (game.genres || []).slice(0, 3);
  const platforms = (game.platforms || []).slice(0, 4).map((entry) => entry.platform.name);
  const inBacklog = BacklogManager.has(game.id);

  return `
    <article class="game-card" data-card-id="${escapeHtml(game.id)}">
      ${mediaMarkup(game)}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(game.name)}</h3>
        <p class="card-meta">${escapeHtml(game.released ? game.released.slice(0, 4) : "TBA")}${
          platforms.length
            ? " &bull; " + platforms.map(escapeHtml).join(" &bull; ")
            : ""
        }</p>
        <div class="card-tags">
          ${genres.map((genre) => `<span class="tag">${escapeHtml(genre.name)}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button class="btn btn-outline btn-sm" type="button" data-details="${escapeHtml(game.id)}">
            View Details
          </button>
          ${
            inBacklog
              ? `<button class="in-backlog-flag" type="button" data-remove="${escapeHtml(game.id)}"
                    title="Remove from backlog">${ICONS.check} In backlog</button>`
              : `<button class="btn btn-primary btn-sm" type="button" data-add="${escapeHtml(game.id)}">
                    + Backlog
                 </button>`
          }
        </div>
      </div>
    </article>`;
}

export default class GameList {
  constructor(container, { onSelect = null } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.games = [];

    this.container.addEventListener("click", (event) => {
      const detailsBtn = event.target.closest("[data-details]");
      if (detailsBtn) {
        this.onSelect?.(detailsBtn.dataset.details);
        return;
      }

      const addBtn = event.target.closest("[data-add]");
      if (addBtn) {
        this.#addToBacklog(addBtn.dataset.add);
        return;
      }

      const removeBtn = event.target.closest("[data-remove]");
      if (removeBtn) {
        this.#removeFromBacklog(removeBtn.dataset.remove);
      }
    });

    document.addEventListener("gv:backlog-changed", () => this.refreshFlags());
  }

  #findGame(id) {
    return this.games.find((game) => String(game.id) === String(id));
  }

  #addToBacklog(id) {
    const game = this.#findGame(id);
    if (!game) return;
    const result = BacklogManager.add(game);
    if (result.ok) {
      alertMessage(`"${game.name}" added to your backlog.`, "success");
    } else {
      alertMessage(`"${game.name}" is already in your backlog.`, "info");
    }
    this.refreshFlags();
  }

  #removeFromBacklog(id) {
    const game = this.#findGame(id);
    BacklogManager.remove(id);
    alertMessage(`"${game?.name ?? "Game"}" removed from your backlog.`, "info");
    this.refreshFlags();
  }

  /** Render cards. Pass `{ append: true }` for incremental "load more" pages. */
  render(games, { append = false } = {}) {
    if (!append) {
      this.games = [];
      this.container.innerHTML = "";
    }

    const markup = games.map(cardMarkup).join("");
    this.container.insertAdjacentHTML("beforeend", markup);
    this.games = this.games.concat(games);
    this.#attachImageFallbacks();
  }

  /** Toggle card buttons without re-rendering (keeps scroll position). */
  refreshFlags() {
    this.container.querySelectorAll("[data-card-id]").forEach((card) => {
      const id = card.dataset.cardId;
      const slot = card.querySelector(".card-actions");
      if (!slot) return;

      const inBacklog = BacklogManager.has(id);
      const hasAddBtn = Boolean(slot.querySelector("[data-add]"));
      const hasFlag = Boolean(slot.querySelector(".in-backlog-flag"));

      if (inBacklog && !hasFlag) {
        const addBtn = slot.querySelector("[data-add]");
        if (addBtn) {
          const flag = document.createElement("button");
          flag.className = "in-backlog-flag";
          flag.type = "button";
          flag.dataset.remove = id;
          flag.title = "Remove from backlog";
          flag.innerHTML = `${ICONS.check} In backlog`;
          addBtn.replaceWith(flag);
        }
      } else if (!inBacklog && hasFlag) {
        const flag = slot.querySelector(".in-backlog-flag");
        const btn = document.createElement("button");
        btn.className = "btn btn-primary btn-sm";
        btn.type = "button";
        btn.dataset.add = id;
        btn.textContent = "+ Backlog";
        flag.replaceWith(btn);
      }
    });
  }

  clear() {
    this.games = [];
    this.container.innerHTML = "";
  }

  showLoading(count = 8) {
    this.clear();
    this.container.innerHTML = Array.from({ length: count })
      .map(() => '<div class="skeleton" aria-hidden="true"></div>')
      .join("");
  }

  showState({ title = "", message = "", action = "" } = {}) {
    this.clear();
    this.container.innerHTML = `
      <div class="state-box" style="grid-column: 1 / -1;">
        <span class="state-icon">${ICONS.gamepad}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        ${action}
      </div>`;
  }

  #attachImageFallbacks() {
    this.container.querySelectorAll(".card-media img").forEach((img) => {
      img.addEventListener("error", () => {
        img.hidden = true;
        const fallback = img.parentElement.querySelector(".media-fallback");
        if (fallback) fallback.hidden = false;
      });
    });
  }
}
