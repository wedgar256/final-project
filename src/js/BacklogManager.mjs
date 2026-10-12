/* ==========================================================================
   GameVault — BacklogManager.mjs
   CRUD controller for the localStorage backlog. Every mutation emits a
   `gv:backlog-changed` CustomEvent so open views can refresh in place.
   ========================================================================== */

import { KEYS, getLocalStorage, setLocalStorage, STATUSES } from "./utils.mjs";

const EVENT_NAME = "gv:backlog-changed";

function normalize(status) {
  return STATUSES.includes(status) ? status : STATUSES[0];
}

function read() {
  const backlog = getLocalStorage(KEYS.backlog, []);
  if (!Array.isArray(backlog)) return [];
  return backlog.filter((item) => item && item.id != null);
}

function write(items) {
  setLocalStorage(KEYS.backlog, items);
  document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { backlog: items } }));
}

export default class BacklogManager {
  static STATUSES = STATUSES;

  static getAll() {
    return read();
  }

  static get(id) {
    return read().find((item) => String(item.id) === String(id)) || null;
  }

  static has(id) {
    return Boolean(this.get(id));
  }

  static add(game, status = "Plan to Play") {
    const items = read();
    if (items.some((item) => String(item.id) === String(game.id))) {
      return { ok: false, reason: "exists" };
    }

    items.unshift({
      id: game.id,
      title: game.name,
      image: game.background_image || "",
      status: normalize(status),
      dateAdded: new Date().toISOString(),
      rating: game.rating ?? null,
      metacritic: game.metacritic ?? null,
      released: game.released || null,
      genres: (game.genres || []).map((genre) => genre.name).slice(0, 3),
    });

    write(items);
    return { ok: true, status: normalize(status) };
  }

  static remove(id) {
    const items = read().filter((item) => String(item.id) !== String(id));
    write(items);
  }

  static setStatus(id, status) {
    const items = read();
    const target = items.find((item) => String(item.id) === String(id));
    if (!target) return false;
    target.status = normalize(status);
    write(items);
    return true;
  }

  static countByStatus() {
    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    read().forEach((item) => {
      if (item.status in counts) counts[item.status] += 1;
    });
    return counts;
  }

  static getPlanToPlay() {
    return read().filter((item) => item.status === "Plan to Play");
  }

  static clear() {
    write([]);
  }
}
