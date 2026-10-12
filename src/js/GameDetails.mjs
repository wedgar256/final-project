/* ==========================================================================
   GameVault — GameDetails.mjs
   ES6 class for the game detail modal: metadata, screenshots, and the
   inline add-to-backlog / status controls.
   ========================================================================== */

import {
  ICONS,
  STATUSES,
  escapeHtml,
  formatDate,
  alertMessage,
  openModal,
} from "./utils.mjs";
import BacklogManager from "./BacklogManager.mjs";

function factRow(label, value, extraClass = "") {
  return `
    <div class="fact-row ${extraClass}">
      <span class="fact-label">${escapeHtml(label)}</span>
      <span class="fact-value">${value}</span>
    </div>`;
}

function statusControlsMarkup(game) {
  const saved = BacklogManager.get(game.id);

  if (!saved) {
    return `
      <label class="visually-hidden" for="details-status">Backlog status</label>
      <select class="select" id="details-status">
        ${STATUSES.map(
          (status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`
        ).join("")}
      </select>
      <button class="btn btn-primary js-details-add" type="button">Add to backlog</button>`;
  }

  return `
    <label class="visually-hidden" for="details-status">Backlog status</label>
    <select class="select js-details-status" id="details-status" data-id="${escapeHtml(game.id)}">
      ${STATUSES.map(
        (status) =>
          `<option value="${escapeHtml(status)}"${
            status === saved.status ? " selected" : ""
          }>${escapeHtml(status)}</option>`
      ).join("")}
    </select>
    <button class="btn btn-danger js-details-remove" type="button">Remove</button>`;
}

export default class GameDetails {
  constructor(services) {
    this.services = services;
  }

  async open(id) {
    const modal = openModal(`
      <button class="modal-close" type="button" aria-label="Close details">&times;</button>
      <div class="modal-skeleton" aria-live="polite">
        <div class="skeleton"></div>
        <div class="line w80"></div>
        <div class="line w60"></div>
        <div class="line"></div>
      </div>`);

    try {
      const [game, screenshots] = await Promise.all([
        this.services.fetchGameDetails(id),
        this.services.fetchScreenshots(id),
      ]);
      modal.innerHTML = this.#template(game, screenshots);
      this.#bind(modal, game);
    } catch (error) {
      modal.innerHTML = `
        <button class="modal-close" type="button" aria-label="Close details">&times;</button>
        <div class="state-box" style="border: none;">
          <span class="state-icon">${ICONS.gamepad}</span>
          <h3>Could not load details</h3>
          <p>${escapeHtml(error.message)}</p>
        </div>`;
      alertMessage(error.message, "error");
    }
  }

  #template(game, screenshots) {
    const genres = (game.genres || []).map((genre) => genre.name);
    const platforms = (game.platforms || []).map((entry) => entry.platform.name);
    const stores = (game.stores || [])
      .map((entry) => entry.store?.name)
      .filter(Boolean);

    const shotList = screenshots.length
      ? screenshots
          .map(
            (shot) =>
              `<img src="${escapeHtml(shot.image)}" alt="${escapeHtml(game.name)} screenshot"
                    loading="lazy" decoding="async">`
          )
          .join("")
      : `<p class="muted">No screenshots available for this title.</p>`;

    return `
      <button class="modal-close" type="button" aria-label="Close details">&times;</button>
      <div class="details-hero">
        ${
          game.background_image
            ? `<img src="${escapeHtml(game.background_image)}" alt="${escapeHtml(game.name)} artwork">`
            : ""
        }
      </div>
      <div class="details-body">
        <h2 class="details-title">${escapeHtml(game.name)}</h2>

        <div class="details-quickstats">
          ${
            game.rating
              ? `<span class="quickstat is-accent">${ICONS.star}<strong>${Number(
                  game.rating
                ).toFixed(1)}</strong>&nbsp;/ 5</span>`
              : ""
          }
          ${
            game.metacritic
              ? `<span class="quickstat is-deal"><strong>Metacritic ${game.metacritic}</strong></span>`
              : ""
          }
          <span class="quickstat">Released <strong>${escapeHtml(
            formatDate(game.released)
          )}</strong></span>
          ${
            game.playtime
              ? `<span class="quickstat"><strong>${game.playtime}h</strong>&nbsp;avg. playtime</span>`
              : ""
          }
        </div>

        <div class="details-grid">
          <div>
            <div class="details-desc">${
              game.description_raw
                ? `<p>${escapeHtml(game.description_raw)}</p>`
                : '<p class="muted">No description available.</p>'
            }</div>
          </div>
          <aside class="details-facts">
            ${factRow(
              "Genres",
              `<div class="fact-tags">${
                genres.length
                  ? genres.map((name) => `<span class="tag">${escapeHtml(name)}</span>`).join("")
                  : "—"
              }</div>`
            )}
            ${factRow(
              "Platforms",
              `<div class="fact-tags">${
                platforms.length
                  ? platforms
                      .slice(0, 8)
                      .map((name) => `<span class="tag">${escapeHtml(name)}</span>`)
                      .join("")
                  : "—"
              }</div>`
            )}
            ${factRow("Stores", escapeHtml(stores.slice(0, 4).join(", ") || "—"))}
            ${factRow("Released", escapeHtml(formatDate(game.released)))}
          </aside>
        </div>

        <div>
          <p class="screenshots-head">Screenshots</p>
          <div class="screenshots-row">${shotList}</div>
        </div>

        <div class="details-actions js-details-actions">
          ${statusControlsMarkup(game)}
        </div>
      </div>`;
  }

  #bind(modal, game) {
    const actions = modal.querySelector(".js-details-actions");

    modal.querySelectorAll(".details-hero img, .screenshots-row img").forEach((img) => {
      img.addEventListener("error", () => {
        img.hidden = true;
      });
    });

    const addBtn = actions?.querySelector(".js-details-add");
    addBtn?.addEventListener("click", () => {
      const select = actions.querySelector("#details-status");
      const status = select?.value || "Plan to Play";
      const result = BacklogManager.add(game, status);
      if (result.ok) {
        alertMessage(`"${game.name}" added — ${status}.`, "success");
        actions.innerHTML = statusControlsMarkup(game);
        this.#bindActions(modal, game, actions);
      } else {
        alertMessage(`"${game.name}" is already in your backlog.`, "info");
      }
    });

    this.#bindActions(modal, game, actions);
  }

  #bindActions(modal, game, actions) {
    if (!actions) return;

    const statusSelect = actions.querySelector(".js-details-status");
    statusSelect?.addEventListener("change", () => {
      BacklogManager.setStatus(game.id, statusSelect.value);
      alertMessage(`"${game.name}" moved to ${statusSelect.value}.`, "success", 3000);
    });

    const removeBtn = actions.querySelector(".js-details-remove");
    removeBtn?.addEventListener("click", () => {
      BacklogManager.remove(game.id);
      alertMessage(`"${game.name}" removed from your backlog.`, "info", 3000);
      actions.innerHTML = statusControlsMarkup(game);
      this.#bind(modal, game);
    });
  }
}
