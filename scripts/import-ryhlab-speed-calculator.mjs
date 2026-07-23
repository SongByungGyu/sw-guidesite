import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const SOURCE_URL = "https://www.ryhlab.com/speed";
const SOURCE_ORIGIN = new URL(SOURCE_URL).origin;
const OUTPUT_PATH = path.resolve("src/data/speed-calculator.json");

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "jiltu-guild-speed-importer/1.0" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function readJsonModules(chunks) {
  const literalPattern = String.raw`("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')`;
  const modulePattern = new RegExp(String.raw`JSON\.parse\(${literalPattern}\)`, "g");
  const modules = [];

  for (const chunk of chunks) {
    for (const match of chunk.matchAll(modulePattern)) {
      try {
        const serialized = vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1_000 });
        modules.push(JSON.parse(serialized));
      } catch {
        // Unrelated Next.js payloads are ignored.
      }
    }
  }

  return modules;
}

function findObjectCatalog(modules, predicate, label) {
  const catalog = modules.find((value) => {
    if (!value || Array.isArray(value) || typeof value !== "object") return false;
    const entries = Object.values(value);
    return entries.length > 500 && entries.slice(0, 20).every(predicate);
  });
  if (!catalog) throw new Error(`ryhlab ${label} catalog not found`);
  return catalog;
}

function findArrayCatalog(modules, predicate, label) {
  const catalog = modules.find((value) => Array.isArray(value)
    && value.length > 800
    && value.slice(0, 20).every(predicate));
  if (!catalog) throw new Error(`ryhlab ${label} catalog not found`);
  return catalog;
}

function normalizeSkillEffects(chainMonster) {
  if (!chainMonster) return [];
  return (chainMonster.sequence ?? []).map((skill) => ({
    skillSlot: skill.skillSlot,
    skillName: skill.skillName,
    effects: (skill.effects ?? [])
      .filter((effect) => effect.type === "speed_buff" || effect.type === "atb_increase")
      .map((effect) => ({
        type: effect.type,
        target: effect.target,
        amount: effect.type === "atb_increase" ? Number(effect.amount ?? 0) : 0,
      })),
  })).filter((skill) => skill.effects.length > 0);
}

async function main() {
  const page = await fetchText(SOURCE_URL);
  const scriptUrls = [...page.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
    .map((match) => new URL(match[1], SOURCE_ORIGIN).href)
    .filter((url, index, urls) => urls.indexOf(url) === index);
  if (!scriptUrls.length) throw new Error("No JavaScript chunks found on ryhlab speed page");

  const chunks = await Promise.all(scriptUrls.map(fetchText));
  const modules = readJsonModules(chunks);
  const koreanCatalog = findObjectCatalog(
    modules,
    (monster) => typeof monster?.name === "string" && typeof monster?.element === "string",
    "Korean monster",
  );
  const externalIdCatalog = findObjectCatalog(
    modules,
    (monster) => Number.isInteger(monster?.swarfarm_id) && typeof monster?.swarfarm_name === "string",
    "external ID",
  );
  const swarfarmCatalog = findArrayCatalog(
    modules,
    (monster) => Number.isInteger(monster?.id) && Number.isFinite(monster?.speed),
    "base speed",
  );
  const chainCatalog = modules.find((value) => Array.isArray(value?.monsters)
    && value.monsters.length > 30
    && value.monsters.every((monster) => Number.isInteger(monster?.id)));
  if (!chainCatalog) throw new Error("ryhlab chain effect catalog not found");

  const swarfarmById = new Map(swarfarmCatalog.map((monster) => [monster.id, monster]));
  const chainById = new Map(chainCatalog.monsters.map((monster) => [monster.id, monster]));
  const monsters = {};

  for (const [id, korean] of Object.entries(koreanCatalog)) {
    const external = externalIdCatalog[id];
    const swarfarm = external ? swarfarmById.get(external.swarfarm_id) : null;
    if (!swarfarm || !Number.isFinite(swarfarm.speed)) continue;
    const leader = swarfarm.leader_skill?.attribute === "Attack Speed"
      ? {
          amount: Number(swarfarm.leader_skill.amount ?? 0),
          area: String(swarfarm.leader_skill.area ?? "General"),
          element: swarfarm.leader_skill.element
            ? String(swarfarm.leader_skill.element).toUpperCase()
            : String(korean.element ?? "").toUpperCase(),
        }
      : null;

    monsters[id] = {
      baseSpeed: Number(swarfarm.speed),
      speedLeader: leader,
      skills: normalizeSkillEffects(chainById.get(external.swarfarm_id)),
    };
  }

  const payload = {
    sourceName: "ryhlab",
    sourceUrl: SOURCE_URL,
    sourceUpdatedAt: new Date().toISOString(),
    towerSpeedPct: 15,
    count: Object.keys(monsters).length,
    automaticSkillMonsterCount: Object.values(monsters).filter((monster) => monster.skills.length > 0).length,
    monsters,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(JSON.stringify({
    count: payload.count,
    automaticSkillMonsterCount: payload.automaticSkillMonsterCount,
    sourceUrl: payload.sourceUrl,
  }, null, 2));
}

await main();
