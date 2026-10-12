// Quick logic smoke test for GameVault modules (run with: node test-smoke.mjs)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
  createElement() { return { className: "", innerHTML: "", appendChild() {}, querySelector() { return null; } }; },
  querySelectorAll() { return []; },
  getElementById() { return null; },
};
globalThis.window = { location: { search: "", href: "" } };

const { default: ExternalServices } = await import("./src/js/ExternalServices.mjs");
const { default: BacklogManager } = await import("./src/js/BacklogManager.mjs");
const { DEMO_GAMES } = await import("./src/js/demoData.mjs");

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures += 1;
};

const svc = new ExternalServices();
check("demo mode active without key", svc.demoMode === true);

const search1 = await svc.searchGames({ query: "hade" });
check("search 'hade' finds Hades + Hades II", search1.results.some((g) => g.name === "Hades") && search1.results.some((g) => g.name === "Hades II"));

const search2 = await svc.searchGames({ genres: ["rpg"], platform: "pc", ordering: "-metacritic" });
check("genre+platform filter returns RPGs", search2.results.length > 0 && search2.results.every((g) => g.genres.some((x) => x.slug === "rpg")));

const search3 = await svc.searchGames({ ordering: "name", page: 1, pageSize: 5 });
check("pagination returns page size 5", search3.results.length === 5 && typeof search3.next === "boolean");
check("name sort ascending", search3.results[0].name <= search3.results[1].name);

const search4 = await svc.searchGames({ platform: "switch" });
check("switch filter matches", search4.results.length > 0 && search4.results.every((g) => g.platforms.some((p) => p.platform.name.includes("Switch"))));

const details = await svc.fetchGameDetails(DEMO_GAMES[0].id);
check("details fetch by id", details.name === "Elden Ring" && Boolean(details.description_raw));

// BacklogManager CRUD
let added = BacklogManager.add(DEMO_GAMES[0]);
check("add to backlog", added.ok && BacklogManager.has(DEMO_GAMES[0].id));
check("duplicate add rejected", BacklogManager.add(DEMO_GAMES[0]).ok === false);
BacklogManager.add(DEMO_GAMES[3]);
BacklogManager.setStatus(DEMO_GAMES[0].id, "Currently Playing");
check("status update", BacklogManager.get(DEMO_GAMES[0].id).status === "Currently Playing");
check("countByStatus", BacklogManager.countByStatus()["Currently Playing"] === 1 && BacklogManager.countByStatus()["Plan to Play"] === 1);
check("getPlanToPlay", BacklogManager.getPlanToPlay().length === 1);
BacklogManager.remove(DEMO_GAMES[0].id);
check("remove", BacklogManager.has(DEMO_GAMES[0].id) === false);
BacklogManager.clear();
check("clear", BacklogManager.getAll().length === 0);

// persistence round trip
BacklogManager.add(DEMO_GAMES[5], "Completed");
const raw = JSON.parse(store.get("gamevault-backlog"));
check("persisted to localStorage", raw.length === 1 && raw[0].status === "Completed" && raw[0].title === "Hades II");

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
