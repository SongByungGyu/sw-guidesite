import { describe, expect, it } from "vitest";
import { buildHomeworkProgress, canManageGuildContent, createAnnouncementSchema, createChangeRequestSchema, createDefenseSchema, createDungeonGuideSchema, createHomeworkSchema, createScheduleSchema } from "@/lib/content-api";

const monsterIds = ["1001", "1002", "1003", "1004", "1005"];
const builds = monsterIds.map((monsterId, position) => ({
  monsterId,
  position,
  isLeader: position === 0,
  runeSets: "폭주 + 의지",
  hp: 25000,
  attack: 1200,
  defense: 1100,
  speed: 220,
  critRate: 70,
  critDamage: 150,
  resistance: 30,
  accuracy: 45,
  artifactLeft: "속성 피해 감소",
  artifactRight: "2스킬 효과 적중",
  note: "행동 순서 기준",
}));

describe("guild content validation", () => {
  it("allows only owners and officers to manage guild homework", () => {
    expect(canManageGuildContent("OWNER")).toBe(true);
    expect(canManageGuildContent("OFFICER")).toBe(true);
    expect(canManageGuildContent("MEMBER")).toBe(false);
  });

  it("requires exactly three unique monsters for defenses", () => {
    expect(createDefenseSchema.safeParse({ title: "방덱", skillOrder: "2스 → 3스 → 1스", builds: builds.slice(0, 3) }).success).toBe(true);
    expect(createDefenseSchema.safeParse({ title: "방덱", skillOrder: "", builds: [builds[0], builds[0], builds[1]] }).success).toBe(false);
  });

  it("matches the registered team size for each dungeon", () => {
    const base = { dungeonKey: "cairos-giant", title: "거인 안정 공략", summary: "안정적인 자동 전투 편성", strategy: "방어력 감소 후 순서대로 공격합니다.", difficulty: "보통", clearTime: "55초" };
    expect(createDungeonGuideSchema.safeParse({ ...base, builds }).success).toBe(true);
    const result = createDungeonGuideSchema.safeParse({ ...base, builds: builds.slice(0, 4) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain("5마리");
  });

  it("requires exactly three monsters for homework", () => {
    const result = createHomeworkSchema.safeParse({ title: "공식 공덱 사용", target: "면역 없는 방어덱", strategy: "해제 후 핵심 딜러부터 공격합니다.", dueAt: null, builds: builds.slice(0, 3) });
    expect(result.success).toBe(true);
  });

  it("requires rune sets and at least one stat for each homework monster", () => {
    const base = { title: "점령전 공덱 숙제", target: "속도 리더 방어덱", strategy: "해제 후 핵심 딜러부터 공격합니다.", dueAt: null };
    expect(createHomeworkSchema.safeParse({ ...base, builds: builds.slice(0, 3).map((build) => ({ ...build, runeSets: "" })) }).success).toBe(false);
    expect(createHomeworkSchema.safeParse({ ...base, builds: builds.slice(0, 3).map((build) => ({ ...build, hp: null, attack: null, defense: null, speed: null, critRate: null, critDamage: null, resistance: null, accuracy: null })) }).success).toBe(false);
  });

  it("separates completed and incomplete guild members", () => {
    const completedAt = new Date("2026-07-22T12:00:00.000Z");
    const progress = buildHomeworkProgress([
      { id: "owner", nickname: "길드장", role: "OWNER" },
      { id: "member", nickname: "길드원", role: "MEMBER" },
    ], [{ memberId: "member", completedAt }]);
    expect(progress.total).toBe(2);
    expect(progress.completed).toEqual([{ id: "member", nickname: "길드원", role: "MEMBER", completedAt: completedAt.toISOString() }]);
    expect(progress.incomplete).toEqual([{ id: "owner", nickname: "길드장", role: "OWNER" }]);
  });

  it("validates announcements and schedule time ranges", () => {
    expect(createAnnouncementSchema.safeParse({ title: "점령전 안내", content: "공격 전 방덱을 확인해 주세요.", pinned: true }).success).toBe(true);
    expect(createAnnouncementSchema.safeParse({ title: "", content: "짧음", pinned: false }).success).toBe(false);
    expect(createScheduleSchema.safeParse({ title: "점령전 마감", category: "점령전", startsAt: "2026-07-23T10:00:00.000Z", endsAt: "2026-07-23T12:00:00.000Z" }).success).toBe(true);
    expect(createScheduleSchema.safeParse({ title: "점령전 마감", category: "점령전", startsAt: "2026-07-23T12:00:00.000Z", endsAt: "2026-07-23T10:00:00.000Z" }).success).toBe(false);
  });

  it("validates guild change requests", () => {
    expect(createChangeRequestSchema.safeParse({ category: "기능 요청", content: "방덱 상세 화면에 메모를 추가해 주세요." }).success).toBe(true);
    expect(createChangeRequestSchema.safeParse({ category: "임의 분류", content: "요청 내용입니다." }).success).toBe(false);
    expect(createChangeRequestSchema.safeParse({ category: "오류 수정", content: "짧음" }).success).toBe(false);
  });
});
