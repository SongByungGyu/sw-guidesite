import { describe, expect, it } from "vitest";
import { buildMetaDefenseTop, createCombinationKey, createOffenseDeckSchema, recordMetaDefenseSchema } from "@/lib/deck-api";

const validInput = {
  defenseIds: ["2013", "1105", "3012"],
  offenseIds: ["1001", "1002", "1003"],
  leaderSlot: 1,
  title: "안정형 선턴 공덱",
  strategy: "첫 몬스터로 해제한 뒤 핵심 대상을 제어합니다.",
  minimumRequirements: "",
  caution: "",
  status: "published" as const,
};

describe("deck API validation", () => {
  it("creates an order-independent defense key", () => {
    expect(createCombinationKey(["3012", "1105", "2013"]))
      .toBe(createCombinationKey(["2013", "3012", "1105"]));
  });

  it("accepts a complete published offense deck", () => {
    expect(createOffenseDeckSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects duplicate monsters and incomplete published guidance", () => {
    const result = createOffenseDeckSchema.safeParse({
      ...validInput,
      offenseIds: ["1001", "1001", "1002"],
      title: "",
      strategy: "짧음",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
        "서로 다른 몬스터 3마리를 선택해 주세요.",
        "제목은 두 글자 이상 입력해 주세요.",
        "운용법을 10자 이상 입력해 주세요.",
      ]));
    }
  });

  it("allows an incomplete draft after both teams are selected", () => {
    const result = createOffenseDeckSchema.safeParse({
      ...validInput,
      title: "",
      strategy: "",
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("validates 4-star and 5-star meta defense records", () => {
    expect(recordMetaDefenseSchema.safeParse({ towerGrade: 4, monsterIds: ["1301", "1302", "1303"] }).success).toBe(true);
    expect(recordMetaDefenseSchema.safeParse({ towerGrade: 4, monsterIds: ["1101", "1302", "1303"] }).success).toBe(false);
    expect(recordMetaDefenseSchema.safeParse({ towerGrade: 5, monsterIds: ["1101", "1302", "1303"] }).success).toBe(true);
  });

  it("ranks meta defenses by record count and recency", () => {
    const rows = buildMetaDefenseTop([
      { towerGrade: 5, combinationKey: "a:b:c", monsterIds: ["a", "b", "c"], recordedOn: new Date("2026-07-20") },
      { towerGrade: 5, combinationKey: "a:b:c", monsterIds: ["a", "b", "c"], recordedOn: new Date("2026-07-21") },
      { towerGrade: 5, combinationKey: "d:e:f", monsterIds: ["d", "e", "f"], recordedOn: new Date("2026-07-22") },
      { towerGrade: 4, combinationKey: "g:h:i", monsterIds: ["g", "h", "i"], recordedOn: new Date("2026-07-22") },
    ]);
    expect(rows.fiveStar.map((row) => [row.combinationKey, row.recordCount])).toEqual([["a:b:c", 2], ["d:e:f", 1]]);
    expect(rows.fourStar[0]?.combinationKey).toBe("g:h:i");
  });
});
