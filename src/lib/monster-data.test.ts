import { describe, expect, it } from "vitest";
import { getMonster, monsterCatalogMeta, monsters } from "@/lib/monster-data";

describe("ryhlab monster catalog", () => {
  it("contains the complete imported catalog", () => {
    expect(monsters).toHaveLength(monsterCatalogMeta.count);
    expect(monsters.length).toBeGreaterThan(800);
  });

  it("maps known Korean shorthand and local images", () => {
    expect(getMonster("2013")).toMatchObject({
      displayName: "물이누",
      englishName: "Icaru",
      element: "WATER",
      grade: 3,
      imageUrl: "/monsters/2013.png",
    });
  });

  it("contains every supported element and grade", () => {
    expect(new Set(monsters.map((monster) => monster.element))).toEqual(
      new Set(["FIRE", "WATER", "WIND", "LIGHT", "DARK"]),
    );
    expect(new Set(monsters.map((monster) => monster.grade))).toEqual(new Set([2, 3, 4, 5]));
  });
});
