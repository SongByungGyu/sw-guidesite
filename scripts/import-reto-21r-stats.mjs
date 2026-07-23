import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://swseige.duckdns.org/api/reto-temp";
const OUTPUT_PATH = path.resolve("src/data/reto-21r-stats.json");
const FIRST_UPLOAD_ID = 42;
const LAST_UPLOAD_ID = 102;
const CONCURRENCY = 6;

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "jiltu-guild-stats-import/1.0" },
  });
  if (!response.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return results;
}

function emptyStats() {
  return { uses: 0, battles: 0, wins: 0, losses: 0 };
}

function addBattle(stats, result) {
  if (result === "DEFENSE_WIN") {
    stats.battles += 1;
    stats.wins += 1;
  } else if (result === "DEFENSE_LOSE") {
    stats.battles += 1;
    stats.losses += 1;
  }
}

const [allUploads, monsterGrades] = await Promise.all([
  fetchJson(`${API_BASE}/logs/uploads`),
  fetchJson(`${API_BASE}/logs/monster-grades`),
]);

const uploads = allUploads
  .filter((upload) => upload.id >= FIRST_UPLOAD_ID && upload.id <= LAST_UPLOAD_ID && upload.status === "SUCCESS")
  .sort((left, right) => left.id - right.id);

if (uploads.length !== 61) {
  throw new Error(`Expected 61 Season 21 uploads, received ${uploads.length}.`);
}

const payloads = await mapWithConcurrency(uploads, async (upload) => {
  const [decks, battleLogs] = await Promise.all([
    fetchJson(`${API_BASE}/logs/uploads/${upload.id}/defense-decks`),
    fetchJson(`${API_BASE}/logs/uploads/${upload.id}/defense-battle-logs`),
  ]);
  return { upload, decks, battleLogs };
});

const combinations = new Map();
const deckLookup = new Map();
const guilds = new Set();
const matches = new Set();
let defenseDeckCount = 0;
let battleLogCount = 0;
let matchedBattleLogCount = 0;

for (const { upload, decks, battleLogs } of payloads) {
  const segmentKey = `${upload.serverCode}:${upload.roundNumber}`;
  matches.add(`${upload.serverCode}:${upload.matchId}`);
  defenseDeckCount += decks.length;
  battleLogCount += battleLogs.length;

  for (const deck of decks) {
    guilds.add(`${upload.serverCode}:${deck.guildId}`);
    const monsters = [1, 2, 3].map((position) => {
      const id = String(deck[`monster${position}Id`]);
      return {
        id,
        name: deck[`monster${position}Name`],
        imageUrl: deck[`monster${position}ImageUrl`],
        element: String(deck[`monster${position}Element`] ?? "").toUpperCase(),
        grade: Number(monsterGrades[id] ?? 0),
      };
    });
    const key = monsters.map((monster) => monster.id).join(":");
    let item = combinations.get(key);
    if (!item) {
      item = {
        key,
        grade: monsters.some((monster) => monster.grade === 5) ? 5 : 4,
        monsters,
        totals: emptyStats(),
        breakdown: {},
        rounds: new Set(),
        servers: new Set(),
        matches: new Set(),
      };
      combinations.set(key, item);
    }
    item.totals.uses += 1;
    item.breakdown[segmentKey] ??= emptyStats();
    item.breakdown[segmentKey].uses += 1;
    item.rounds.add(upload.roundNumber);
    item.servers.add(upload.serverCode);
    item.matches.add(`${upload.serverCode}:${upload.matchId}`);
    deckLookup.set(`${upload.id}:${deck.deckId}`, item);
  }

  for (const battleLog of battleLogs) {
    const item = deckLookup.get(`${upload.id}:${battleLog.deckId}`);
    if (!item) continue;
    matchedBattleLogCount += 1;
    addBattle(item.totals, battleLog.result);
    item.breakdown[segmentKey] ??= emptyStats();
    addBattle(item.breakdown[segmentKey], battleLog.result);
  }
}

const rows = [...combinations.values()]
  .map((item) => ({
    key: item.key,
    grade: item.grade,
    monsters: item.monsters,
    totals: item.totals,
    breakdown: item.breakdown,
    rounds: [...item.rounds].sort((a, b) => a - b),
    servers: [...item.servers].sort(),
    matchCount: item.matches.size,
  }))
  .sort((left, right) => right.totals.uses - left.totals.uses || right.totals.battles - left.totals.battles);

const output = {
  dataset: {
    title: "레토 21R 방덱 방성 통계",
    generatedAt: new Date().toISOString(),
    sourceUrl: "https://swseige.duckdns.org/",
    sourceApi: `${API_BASE}/logs/uploads`,
    firstUploadId: FIRST_UPLOAD_ID,
    lastUploadId: LAST_UPLOAD_ID,
    uploadCount: uploads.length,
    matchCount: matches.size,
    guildCount: guilds.size,
    combinationCount: rows.length,
    defenseDeckCount,
    battleLogCount,
    matchedBattleLogCount,
    rounds: [...new Set(uploads.map((upload) => upload.roundNumber))].sort((a, b) => a - b),
    servers: [...new Set(uploads.map((upload) => upload.serverCode))].sort(),
  },
  rows,
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
console.log(JSON.stringify(output.dataset, null, 2));
