import { describe, expect, it } from "vitest";
import { getMonsterStatQuality, parseMonsterScreenshotText } from "@/lib/monster-stat-ocr";

describe("monster screenshot OCR parser", () => {
  it("keeps only the plus bonus from a Korean monster detail screenshot", () => {
    const parsed = parseMonsterScreenshotText(`
      체력 10215 +25966
      공격력 659 +207
      방어력 801 +2043
      공격속도 96 +103
      치명 확률 21%
      치명 피해 50%
      효과 저항 100%
      효과 적중 50%
      폭주 의지
    `);

    expect(parsed.stats).toEqual({
      hp: 25966,
      attack: 207,
      defense: 2043,
      speed: 103,
      critRate: 21,
      critDamage: 50,
      resistance: 100,
      accuracy: 50,
    });
    expect(parsed.runeSets).toBe("폭주 + 의지");
    expect(parsed.detectedKeys).toHaveLength(8);
  });

  it("reads values placed on the line after an OCR label", () => {
    const parsed = parseMonsterScreenshotText(`
      HP
      9885 +23479
      ATK 692 +346
      DEF 626 +924
      SPD 102 +192
      CRI Rate 20%
      CRI Dmg 50%
      RES 29%
      ACC 60%
    `);

    expect(parsed.stats.hp).toBe(23479);
    expect(parsed.stats.speed).toBe(192);
    expect(parsed.stats.accuracy).toBe(60);
  });

  it("flags impossible OCR values for manual review", () => {
    expect(getMonsterStatQuality("speed", 192)).toBe("ok");
    expect(getMonsterStatQuality("speed", 2940)).toBe("warning");
    expect(getMonsterStatQuality("accuracy", null)).toBe("missing");
  });
});
