import catalog from "@/data/monsters.json";

export type Element = "FIRE" | "WATER" | "WIND" | "LIGHT" | "DARK";

export type Monster = {
  id: string;
  displayName: string;
  englishName: string;
  element: Element;
  grade: 2 | 3 | 4 | 5;
  imageUrl: string;
  sourceImageUrl: string;
};

export const monsters = catalog.monsters as Monster[];

const monstersById = new Map(monsters.map((monster) => [monster.id, monster]));

export function getMonster(id: string) {
  const monster = monstersById.get(id);
  if (!monster) throw new Error(`Monster not found: ${id}`);
  return monster;
}

export const monsterCatalogMeta = {
  count: catalog.count,
  sourceName: catalog.sourceName,
  sourceUrl: catalog.sourceUrl,
  sourceUpdatedAt: catalog.sourceUpdatedAt,
};
