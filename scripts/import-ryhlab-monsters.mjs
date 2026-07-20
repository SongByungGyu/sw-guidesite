import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const SOURCE_URL = "https://www.ryhlab.com/speed";
const SOURCE_ORIGIN = new URL(SOURCE_URL).origin;
const OUTPUT_PATH = path.resolve("src/data/monsters.json");
const IMAGE_DIR = path.resolve("public/monsters");
const CONCURRENCY = 12;

const elementMap = {
  fire: "FIRE",
  water: "WATER",
  wind: "WIND",
  light: "LIGHT",
  dark: "DARK",
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "sw-guidesite monster importer/1.0" },
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
        const serialized = vm.runInNewContext(`(${match[1]})`, Object.create(null), {
          timeout: 1_000,
        });
        modules.push(JSON.parse(serialized));
      } catch {
        // Unrelated Next.js payloads are ignored.
      }
    }
  }

  return modules;
}

function findCatalog(modules, predicate, label) {
  const catalog = modules.find((value) => {
    if (!value || Array.isArray(value) || typeof value !== "object") return false;
    const entries = Object.values(value);
    return entries.length > 500 && entries.slice(0, 20).every(predicate);
  });
  if (!catalog) throw new Error(`ryhlab ${label} catalog not found`);
  return catalog;
}

async function mapLimit(items, limit, worker) {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function downloadImage(monster) {
  const destination = path.join(IMAGE_DIR, `${monster.id}.png`);
  try {
    await readFile(destination);
    return;
  } catch {
    // Missing images are downloaded below.
  }

  const response = await fetch(monster.sourceImageUrl, {
    headers: { "user-agent": "sw-guidesite monster importer/1.0" },
  });
  if (!response.ok) throw new Error(`Image ${response.status}: ${monster.sourceImageUrl}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const page = await fetchText(SOURCE_URL);
  const scriptUrls = [...page.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
    .map((match) => new URL(match[1], SOURCE_ORIGIN).href)
    .filter((url, index, urls) => urls.indexOf(url) === index);

  if (!scriptUrls.length) throw new Error("No JavaScript chunks found on ryhlab speed page");

  const chunks = await Promise.all(scriptUrls.map(fetchText));
  const modules = readJsonModules(chunks);
  const koreanCatalog = findCatalog(
    modules,
    (monster) => typeof monster?.name === "string"
      && monster.element in elementMap
      && Number.isInteger(monster.stars),
    "Korean monster",
  );
  const externalCatalog = findCatalog(
    modules,
    (monster) => Number.isInteger(monster?.swarfarm_id)
      && typeof monster.swarfarm_name === "string",
    "external ID",
  );

  const monsters = Object.entries(koreanCatalog)
    .map(([id, monster]) => {
      const external = externalCatalog[id];
      return {
        id,
        displayName: monster.name,
        englishName: external?.swarfarm_name ?? "",
        element: elementMap[monster.element],
        grade: monster.stars,
        imageUrl: `/monsters/${id}.png`,
        sourceImageUrl: `${SOURCE_ORIGIN}/monsters/${id}.png`,
      };
    })
    .filter((monster) => monster.element && Number.isInteger(monster.grade))
    .sort((left, right) => Number(left.id) - Number(right.id));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await mkdir(IMAGE_DIR, { recursive: true });
  await mapLimit(monsters, CONCURRENCY, downloadImage);

  const payload = {
    sourceName: "ryhlab",
    sourceUrl: SOURCE_URL,
    sourceUpdatedAt: new Date().toISOString(),
    count: monsters.length,
    monsters,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Imported ${monsters.length} monsters from ${SOURCE_URL}`);
}

await main();
