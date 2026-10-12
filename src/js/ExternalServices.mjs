/* ==========================================================================
   GameVault — ExternalServices.mjs
   Async data layer for RAWG (catalog) and CheapShark (deals).
   Falls back to the bundled demo catalog when no RAWG API key exists.
   ========================================================================== */

import { KEYS, getLocalStorage } from "./utils.mjs";
import { DEMO_GAMES, DEMO_GENRES } from "./demoData.mjs";

export class ApiError extends Error {
  constructor(message, kind = "generic") {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

export const GENRE_FILTERS = DEMO_GENRES;

export const PLATFORM_FILTERS = [
  { value: "all", label: "All platforms" },
  { value: "pc", label: "PC", parent: "1" },
  { value: "playstation", label: "PlayStation", parent: "2" },
  { value: "xbox", label: "Xbox", parent: "3" },
  { value: "switch", label: "Nintendo Switch", parent: "7" },
];

const PLATFORM_MATCHERS = {
  pc: (names) => names.includes("PC") || names.includes("Windows"),
  playstation: (names) => names.some((n) => n.startsWith("PlayStation")),
  xbox: (names) => names.some((n) => n.startsWith("Xbox")),
  switch: (names) => names.includes("Nintendo Switch"),
};

const ORDERS = {
  "-rating": (a, b) => b.rating - a.rating,
  rating: (a, b) => a.rating - b.rating,
  "-metacritic": (a, b) => (b.metacritic ?? -1) - (a.metacritic ?? -1),
  metacritic: (a, b) => (a.metacritic ?? -1) - (b.metacritic ?? -1),
  "-released": (a, b) => String(b.released).localeCompare(String(a.released)),
  released: (a, b) => String(a.released).localeCompare(String(b.released)),
  name: (a, b) => a.name.localeCompare(b.name),
  "-name": (a, b) => b.name.localeCompare(a.name),
};

export default class ExternalServices {
  constructor() {
    this.apiKey = getLocalStorage(KEYS.apiKey, "") || "";
    this.rawgBase = "https://api.rawg.io/api";
    this.cheapsharkBase = "https://www.cheapshark.com/api/1.0";
    this.storeCache = null;
  }

  get demoMode() {
    return !this.apiKey;
  }

  /* ------------------------------------------------------------------ RAWG */

  async #rawg(path, params = {}) {
    const url = new URL(`${this.rawgBase}${path}`);
    url.searchParams.set("key", this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    let response;
    try {
      response = await fetch(url);
    } catch {
      throw new ApiError(
        "Could not reach the RAWG API. Check your internet connection and try again.",
        "network"
      );
    }

    if (response.status === 401) {
      throw new ApiError(
        "RAWG rejected the API key. Open settings and paste a valid key.",
        "auth"
      );
    }
    if (response.status === 429) {
      throw new ApiError(
        "RAWG rate limit reached. Wait a minute and try again.",
        "rate"
      );
    }
    if (!response.ok) {
      throw new ApiError(`RAWG request failed (HTTP ${response.status}).`);
    }
    return response.json();
  }

  /**
   * Search / browse the catalog.
   * @returns {Promise<{results: object[], next: boolean, count: number}>}
   */
  async searchGames({
    query = "",
    genres = [],
    platform = "all",
    ordering = "-rating",
    page = 1,
    pageSize = 20,
  } = {}) {
    if (this.demoMode) return this.#demoSearch({ query, genres, platform, ordering, page, pageSize });

    const params = {
      page,
      page_size: pageSize,
      ordering,
      search: query.trim(),
    };
    if (genres.length) params.genres = genres.join(",");
    const platformFilter = PLATFORM_FILTERS.find((item) => item.value === platform);
    if (platformFilter?.parent) params.parent_platforms = platformFilter.parent;

    const data = await this.#rawg("/games", params);
    return {
      results: Array.isArray(data.results) ? data.results : [],
      next: Boolean(data.next),
      count: data.count ?? 0,
    };
  }

  async fetchGameDetails(id) {
    if (this.demoMode) {
      const game = DEMO_GAMES.find((item) => String(item.id) === String(id));
      if (!game) throw new ApiError("That game is not available in the demo catalog.");
      return game;
    }
    const data = await this.#rawg(`/games/${id}`);
    return {
      ...data,
      description_raw:
        data.description_raw ||
        String(data.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
    };
  }

  async fetchScreenshots(id) {
    if (this.demoMode) return [];
    try {
      const data = await this.#rawg(`/games/${id}/screenshots`, { page_size: 8 });
      return Array.isArray(data.results) ? data.results : [];
    } catch {
      return [];
    }
  }

  /* --------------------------------------------------------------- CheapShark */

  async fetchDeals({
    title = "",
    storeId = "",
    sortBy = "Savings",
    page = 1,
    pageSize = 30,
  } = {}) {
    const params = new URLSearchParams({
      pageNumber: String(page),
      pageSize: String(pageSize),
      onSale: "1",
      sortBy,
    });
    if (title.trim()) params.set("title", title.trim());
    if (storeId) params.set("storeID", storeId);

    let response;
    try {
      response = await fetch(`${this.cheapsharkBase}/deals?${params}`);
    } catch {
      throw new ApiError(
        "Could not reach the CheapShark deals API. Check your connection.",
        "network"
      );
    }
    if (!response.ok) {
      throw new ApiError(`Deals request failed (HTTP ${response.status}).`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async fetchStores() {
    if (this.storeCache) return this.storeCache;
    try {
      const response = await fetch(`${this.cheapsharkBase}/stores`);
      if (!response.ok) throw new Error("stores failed");
      const data = await response.json();
      this.storeCache = Array.isArray(data) ? data : [];
    } catch {
      this.storeCache = [];
    }
    return this.storeCache;
  }

  /* ------------------------------------------------------------ Demo catalog */

  #demoSearch({ query, genres, platform, ordering, page, pageSize }) {
    let results = [...DEMO_GAMES];

    const term = query.trim().toLowerCase();
    if (term) results = results.filter((game) => game.name.toLowerCase().includes(term));

    if (genres.length) {
      results = results.filter((game) =>
        game.genres.some((genre) => genres.includes(genre.slug))
      );
    }

    if (platform !== "all") {
      const matches = PLATFORM_MATCHERS[platform];
      if (matches) {
        results = results.filter((game) =>
          matches(game.platforms.map((item) => item.platform.name))
        );
      }
    }

    const sorter = ORDERS[ordering] || ORDERS["-rating"];
    results.sort((gameA, gameB) => {
      const a = gameA.rating ?? 0;
      const b = gameB.rating ?? 0;
      return sorter({ ...gameA, rating: a }, { ...gameB, rating: b });
    });

    const start = (page - 1) * pageSize;
    const slice = results.slice(start, start + pageSize);
    return Promise.resolve({
      results: slice,
      next: start + pageSize < results.length,
      count: results.length,
    });
  }
}
