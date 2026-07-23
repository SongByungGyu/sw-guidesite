import { describe, expect, it } from "vitest";
import { createHomeworkOffenseGuide, type HomeworkOffense } from "@/lib/homework-offense";

const homework: HomeworkOffense = {
  id: "homework-1",
  title: "점령전 공덱 1회 사용",
  target: "면역 없는 속도 방덱",
  strategy: "해제부터 사용\n핵심 딜러를 우선 공격",
  dueAt: "2026-07-30T12:00:00.000Z",
  status: "ACTIVE",
  author: "길드장",
  updatedAt: "2026-07-24T00:00:00.000Z",
  monsters: [
    { monsterId: "3118", position: 0, isLeader: true, runeSets: "폭주 + 의지", hp: 20000, attack: null, defense: 2000, speed: 90, critRate: null, critDamage: null, resistance: 100, accuracy: 30, artifactLeft: "피해 감소", artifactRight: "효과 적중", note: "" },
    { monsterId: "2131", position: 1, isLeader: false, runeSets: "폭주 + 의지", hp: 26000, attack: null, defense: 800, speed: 140, critRate: null, critDamage: null, resistance: 100, accuracy: null, note: "" },
    { monsterId: "2125", position: 2, isLeader: false, runeSets: "절망 + 의지", hp: 28000, attack: null, defense: 600, speed: 120, critRate: null, critDamage: null, resistance: 100, accuracy: 40, note: "" },
  ],
};

describe("homework offense guide", () => {
  it("turns a homework into an automatically synced guild offense", () => {
    const guide = createHomeworkOffenseGuide(homework);

    expect(guide.id).toBe("homework-homework-1");
    expect(guide.badge).toBe("숙제 연동");
    expect(guide.source).toBe("homework");
    expect(guide.monsters.map((monster) => monster.monsterId)).toEqual(["3118", "2131", "2125"]);
    expect(guide.monsters[0].stats.hp).toBe("+20,000");
    expect(guide.monsters[0].stats.resistance).toBe("100%");
    expect(guide.monsters[0].stats.attack).toBe("상관없음");
    expect(guide.strategy).toEqual(["해제부터 사용", "핵심 딜러를 우선 공격"]);
  });

  it("requires exactly three homework monsters", () => {
    expect(() => createHomeworkOffenseGuide({ ...homework, monsters: homework.monsters.slice(0, 2) })).toThrow("몬스터 3마리");
  });

  it("keeps an archived homework as a saved guild offense", () => {
    const guide = createHomeworkOffenseGuide({ ...homework, status: "ARCHIVED" });

    expect(guide.badge).toBe("숙제 보관");
    expect(guide.note).toContain("숙제 목록에서 삭제해도 유지");
  });
});
