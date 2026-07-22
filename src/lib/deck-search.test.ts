import { describe, expect, it } from "vitest";
import { countDefenseOverlap, getDeckMatch, searchDecks } from "@/lib/deck-search";
import type { Deck } from "@/lib/mock-data";

const defaultDefenseIds = ["2013", "1105", "3012"] as const;
const decks: Deck[] = [
  { id: "safe-control", title: "안정형", summary: "검증 덱", defenseIds: ["2013", "1105", "3012"], offenseIds: ["2120", "1303", "3118"], leaderSlot: 1, wins: 12, battles: 15, recent: "3일 전", updatedAt: "2026-07-17T09:00:00+09:00", author: "태산", isOfficial: true },
  { id: "turn-two", title: "후턴", summary: "후턴 덱", defenseIds: ["3012", "2013", "1105"], offenseIds: ["5106", "2308", "4519"], leaderSlot: 0, wins: 8, battles: 11, recent: "5일 전", updatedAt: "2026-07-15T18:30:00+09:00", author: "마루", isOfficial: false },
  { id: "fast-focus", title: "점사", summary: "부분 일치", defenseIds: ["2013", "3012", "4017"], offenseIds: ["1509", "3012", "4017"], leaderSlot: 1, wins: 5, battles: 8, recent: "1주 전", updatedAt: "2026-07-11T12:00:00+09:00", author: "다온", isOfficial: false },
];

describe("deck search", () => {
  it("방어덱 순서와 관계없이 정확 일치한다", () => {
    expect(getDeckMatch(defaultDefenseIds, [...defaultDefenseIds].reverse())).toBe("exact");
  });

  it("중복 ID를 한 번만 세고 두 마리 이상을 부분 일치로 분류한다", () => {
    expect(countDefenseOverlap(defaultDefenseIds, ["2013", "2013", "3012"])).toBe(2);
    expect(getDeckMatch(defaultDefenseIds, ["2013", "3012", "4017"])).toBe("partial");
  });

  it("한 마리 이하가 같으면 검색 결과에서 제외한다", () => {
    expect(getDeckMatch(defaultDefenseIds, ["4017", "5007", "1509"])).toBe("none");
  });

  it("공식 추천과 작성자 필터를 함께 적용한다", () => {
    const results = searchDecks(decks, defaultDefenseIds, {
      sort: "recommended",
      officialOnly: true,
      author: "태산",
    });

    expect(results.map(({ deck }) => deck.id)).toEqual(["safe-control"]);
  });

  it("사용 횟수와 최신순을 실제 수치와 날짜로 정렬한다", () => {
    const byUses = searchDecks(decks, defaultDefenseIds, { sort: "uses", officialOnly: false, author: "all" });
    const byLatest = searchDecks(decks, defaultDefenseIds, { sort: "latest", officialOnly: false, author: "all" });

    expect(byUses.map(({ deck }) => deck.id)).toEqual(["safe-control", "turn-two", "fast-focus"]);
    expect(byLatest.map(({ deck }) => deck.id)).toEqual(["safe-control", "turn-two", "fast-focus"]);
  });
});
