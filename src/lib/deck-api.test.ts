import { describe, expect, it } from "vitest";
import { createCombinationKey, createOffenseDeckSchema } from "@/lib/deck-api";

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
});
