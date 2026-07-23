import { describe, expect, it } from "vitest";
import { guildOffenseGuides } from "@/lib/guild-offense-guides";
import { monsters } from "@/lib/monster-data";

describe("guild offense guides", () => {
  it("contains the six spreadsheet presets with valid unique monsters", () => {
    const monsterIds = new Set(monsters.map((monster) => monster.id));

    expect(guildOffenseGuides.map((guide) => guide.title)).toEqual([
      "팬토화",
      "팔드유",
      "깨토토",
      "무퓨시",
      "드샤푸",
      "닌호헬",
    ]);

    for (const guide of guildOffenseGuides) {
      const ids = guide.monsters.map((monster) => monster.monsterId);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(ids.every((id) => monsterIds.has(id))).toBe(true);
      expect(guide.strategy.length).toBeGreaterThan(0);
    }
  });
});
