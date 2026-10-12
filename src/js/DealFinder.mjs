/* ==========================================================================
   GameVault — DealFinder.mjs
   Fetches live discounts from CheapShark, renders deal cards, and applies
   store / savings / sort / title filters.
   ========================================================================== */

import { ICONS, escapeHtml, formatPrice, alertMessage } from "./utils.mjs";

const REDIRECT = "https://www.cheapshark.com/redirect?dealID=";

export default class DealFinder {
  constructor(services, elements) {
    this.services = services;
    this.grid = elements.grid;
    this.storeSelect = elements.storeSelect;
    this.savingsSelect = elements.savingsSelect;
    this.sortSelect = elements.sortSelect;
    this.searchInput = elements.searchInput;
    this.loadMoreBtn = elements.loadMoreBtn;
    this.countEl = elements.countEl;

    this.page = 1;
    this.hasMore = true;
    this.loading = false;
    this.deals = [];
    this.stores = [];
    this.filters = { title: "", storeId: "", minSavings: 0, sortBy: "Savings" };
  }

  async init() {
    this.stores = await this.services.fetchStores();
    if (this.storeSelect) {
      const options = ['<option value="">All stores</option>'].concat(
        this.stores.map(
          (store) =>
            `<option value="${escapeHtml(store.storeID)}">${escapeHtml(store.storeName)}</option>`
        )
      );
      this.storeSelect.innerHTML = options.join("");
    }

    this.#bind();
    await this.reset();
  }

  #bind() {
    this.storeSelect?.addEventListener("change", () => {
      this.filters.storeId = this.storeSelect.value;
      this.reset();
    });

    this.savingsSelect?.addEventListener("change", () => {
      this.filters.minSavings = Number(this.savingsSelect.value);
      this.reset();
    });

    this.sortSelect?.addEventListener("change", () => {
      this.filters.sortBy = this.sortSelect.value;
      this.reset();
    });

    let searchTimer;
    this.searchInput?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.filters.title = this.searchInput.value.trim();
        this.reset();
      }, 400);
    });

    this.loadMoreBtn?.addEventListener("click", () => this.loadMore());
  }

  async reset() {
    this.page = 1;
    this.hasMore = true;
    this.deals = [];
    this.grid.innerHTML = Array.from({ length: 8 })
      .map(() => '<div class="skeleton" aria-hidden="true"></div>')
      .join("");
    if (this.loadMoreBtn) this.loadMoreBtn.hidden = true;
    await this.#fetchPage();
  }

  async loadMore() {
    if (!this.hasMore || this.loading) return;
    this.page += 1;
    await this.#fetchPage(true);
  }

  async #fetchPage(append = false) {
    if (this.loading) return;
    this.loading = true;
    if (this.loadMoreBtn) this.loadMoreBtn.disabled = true;

    try {
      const chunk = await this.services.fetchDeals({
        title: this.filters.title,
        storeId: this.filters.storeId,
        sortBy: this.filters.sortBy,
        page: this.page,
        pageSize: 30,
      });

      this.hasMore = chunk.length === 30;

      const visible = chunk.filter(
        (deal) => Number(deal.savings) >= this.filters.minSavings
      );

      this.deals = append ? this.deals.concat(visible) : visible;
      this.render();

      // Keep pulling pages until something matches or results run out.
      if (!append && visible.length === 0 && this.hasMore) {
        this.page += 1;
        this.loading = false;
        await this.#fetchPage(false);
        return;
      }
    } catch (error) {
      this.grid.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <span class="state-icon">${ICONS.tag}</span>
          <h3>Deals are unavailable right now</h3>
          <p>${escapeHtml(error.message)}</p>
          <button class="btn btn-primary js-retry-deals" type="button">Try again</button>
        </div>`;
      this.grid.querySelector(".js-retry-deals")?.addEventListener("click", () => this.reset());
      alertMessage(error.message, "error");
    } finally {
      this.loading = false;
      if (this.loadMoreBtn) {
        this.loadMoreBtn.disabled = false;
        this.loadMoreBtn.hidden = !this.hasMore;
      }
    }
  }

  #storeName(storeId) {
    return this.stores.find((store) => store.storeID === String(storeId))?.storeName || "Store";
  }

  render() {
    if (!this.deals.length) {
      this.grid.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <span class="state-icon">${ICONS.tag}</span>
          <h3>No deals match</h3>
          <p>Try a different store, a lower savings threshold, or another search.</p>
        </div>`;
      if (this.countEl) this.countEl.textContent = "0 deals";
      if (this.loadMoreBtn) this.loadMoreBtn.hidden = true;
      return;
    }

    this.grid.innerHTML = this.deals
      .map((deal) => {
        const savings = Math.round(Number(deal.savings) || 0);
        const metacritic = Number(deal.metacriticScore) || null;
        const positive = Number(deal.steamRatingPercent) || null;
        const thumb = deal.thumb
          ? `<img src="${escapeHtml(deal.thumb)}" alt="${escapeHtml(deal.title)}" loading="lazy">`
          : "";

        return `
          <article class="deal-card">
            <div class="deal-media">
              ${thumb}
              <span class="savings-badge">-${savings}%</span>
              <span class="deal-store">${escapeHtml(this.#storeName(deal.storeID))}</span>
            </div>
            <div class="deal-body">
              <h3 class="card-title">${escapeHtml(deal.title)}</h3>
              <div class="price-row">
                <span class="price-sale">${formatPrice(deal.salePrice)}</span>
                <span class="price-normal">${formatPrice(deal.normalPrice)}</span>
              </div>
              <div class="deal-stats">
                ${
                  metacritic
                    ? `<span class="tag tag-deal">Metacritic ${metacritic}</span>`
                    : ""
                }
                ${
                  positive !== null
                    ? `<span class="tag">${positive}% positive</span>`
                    : ""
                }
                ${
                  deal.steamRatingText
                    ? `<span class="tag">${escapeHtml(deal.steamRatingText)}</span>`
                    : ""
                }
              </div>
              <a class="btn btn-deal btn-sm btn-block"
                 href="${REDIRECT}${escapeHtml(deal.dealID)}"
                 target="_blank" rel="noopener">View deal</a>
            </div>
          </article>`;
      })
      .join("");

    this.grid.querySelectorAll(".deal-media img").forEach((img) => {
      img.addEventListener("error", () => {
        img.hidden = true;
      });
    });

    if (this.countEl) {
      this.countEl.textContent = `${this.deals.length} deal${this.deals.length === 1 ? "" : "s"} loaded`;
    }
  }
}
