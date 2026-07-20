import { describe, expect, it } from "vitest";
import { countDefenseOverlap, getDeckMatch, searchDecks } from "@/lib/deck-search";
import { decks, defaultDefenseIds } from "@/lib/mock-data";

describe("deck search", () => {
  it("방어덱 순서와 관계없이 정확 일치한다", () => {
    expect(getDeckMatch(defaultDefenseIds, [...defaultDefenseIds].reverse())).toBe("exact");
  });

  it("중복 ID를 한 번만 세고 두 마리 이상을 부분 일치로 분류한다", () => {
    expect(countDefenseOverlap(defaultDefenseIds, ["water-inugami", "water-inugami", "wind-griffon"])).toBe(2);
    expect(getDeckMatch(defaultDefenseIds, ["water-inugami", "wind-griffon", "light-fairy"])).toBe("partial");
  });

  it("한 마리 이하가 같으면 검색 결과에서 제외한다", () => {
    expect(getDeckMatch(defaultDefenseIds, ["light-fairy", "dark-werewolf", "fire-bounty"])).toBe("none");
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
