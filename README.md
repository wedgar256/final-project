# GameVault

A responsive video-game backlog & deal tracker. Search thousands of titles, organize your personal library into **Plan to Play / Currently Playing / Completed**, let the **Backlog Roulette** pick your next game, and browse **live digital store discounts**.

Built as a dependency-free static site (HTML + CSS + ES modules) per the project proposal.

## Quick start

ES modules require a local web server (opening the files directly with `file://` will not work):

```bash
# Python
python -m http.server 8080

# or Node
npx serve .
```

Then open <http://localhost:8080>.

### Catalog data

- **Out of the box (demo mode):** a bundled catalog of 22 popular games, so search, filters, details, and the backlog work with zero setup.
- **Full live catalog:** click the **⚙ settings** icon in the header, paste a free [RAWG API key](https://rawg.io/apis), and the app switches to the live RAWG database. The key is stored only in your browser's `localStorage`.

**Game Deals** always uses the live [CheapShark API](https://apidocs.cheapshark.com/) (no key required).

## Features

- Multi-criteria search (title/keyword) with async API calls — no page reloads
- Filter by genre, platform (PC/PlayStation/Xbox/Switch) and minimum rating; sort by Metacritic, rating, release date, or name
- Game detail modal: artwork, release date, ratings, platforms, stores, screenshots
- Add any game to your backlog with a tracking status; update or remove later, live
- Persistent `localStorage` storage across browser sessions
- Backlog Roulette: animated random pick from your "Plan to Play" list (one click to promote it to "Currently Playing")
- Live deals: store filter, minimum-savings filter, title search, sorting, direct store links
- Dark/light theme toggle, mobile drawer + bottom navigation, adaptive desktop grid
- Graceful error handling: alert banners, empty states, retry actions, image fallbacks

## Project structure

```
index.html              # Home: search, filters, game grid
backlog/index.html      # Backlog board + roulette
deals/index.html        # Live CheapShark deals
src/css/
  style.css             # Variables, reset, layout, forms, alerts
  header.css            # Header, nav, drawer, bottom nav
  cards.css             # Game/deal cards, filters, backlog board
  modal.css             # Modals (details, settings, roulette)
src/js/
  main.js               # Bootstrap + per-view controllers
  ExternalServices.mjs  # RAWG & CheapShark fetch layer (+ demo mode)
  GameList.mjs          # Game card rendering & card actions
  GameDetails.mjs       # Detail modal component
  BacklogManager.mjs    # localStorage CRUD + change events
  DealFinder.mjs        # Deals rendering & discount filters
  demoData.mjs          # Offline demo catalog
  utils.mjs             # Storage, alerts, modal shell, header/footer, theme
```

## Local storage schema

| Key | Contents |
| --- | --- |
| `gamevault-backlog` | Array of `{ id, title, image, status, dateAdded, rating, metacritic, released, genres }` |
| `gamevault-theme` | `"dark"` or `"light"` |
| `gamevault-rawg-key` | RAWG API key (optional) |

All backlog mutations emit a `gv:backlog-changed` `CustomEvent` so open views and nav badges refresh instantly.

## Verification

```bash
node test-smoke.mjs     # Logic tests: demo search, filters, pagination, backlog CRUD
```

Browser smoke tests (search, filters, modal, backlog, roulette, live deals, mobile layout, theme) were run headless against a local server during development.

## Data sources

- [RAWG Video Games Database API](https://api.rawg.io/docs/) — game catalog metadata & media (requires a free API key for the full catalog)
- [CheapShark API](https://www.cheapshark.com) — live digital storefront deals (no key required)
