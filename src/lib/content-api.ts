import { z } from "zod";
import { dungeonByKey } from "@/lib/dungeon-catalog";
import { monsters } from "@/lib/monster-data";

const monsterIds = new Set(monsters.map((monster) => monster.id));
const optionalStat = z.number().int().min(0).max(999999).nullable().optional();

export const monsterBuildSchema = z.object({
  monsterId: z.string().refine((id) => monsterIds.has(id), "몬스터 정보를 확인해 주세요."),
  position: z.number().int().min(0).max(14),
  isLeader: z.boolean().default(false),
  runeSets: z.string().trim().max(80).default(""),
  hp: optionalStat,
  attack: optionalStat,
  defense: optionalStat,
  speed: optionalStat,
  critRate: optionalStat,
  critDamage: optionalStat,
  resistance: optionalStat,
  accuracy: optionalStat,
  note: z.string().trim().max(300).default(""),
});

export const homeworkBuildSchema = monsterBuildSchema.extend({
  runeSets: z.string().trim().min(1, "몬스터별 룬 세트를 입력해 주세요.").max(80),
  artifactLeft: z.string().trim().max(100).default(""),
  artifactRight: z.string().trim().max(100).default(""),
}).superRefine((build, context) => {
  const stats = [build.hp, build.attack, build.defense, build.speed, build.critRate, build.critDamage, build.resistance, build.accuracy];
  if (!stats.some((value) => value !== null && value !== undefined)) {
    context.addIssue({ code: "custom", message: "몬스터별로 필요한 최소 스탯을 하나 이상 입력해 주세요." });
  }
});

const uniqueBuilds = (builds: Array<{ monsterId: string }>, context: z.RefinementCtx) => {
  if (new Set(builds.map((build) => build.monsterId)).size !== builds.length) {
    context.addIssue({ code: "custom", message: "같은 몬스터를 중복 선택할 수 없습니다." });
  }
};

export const createDefenseSchema = z.object({
  title: z.string().trim().min(2).max(60),
  note: z.string().trim().max(1000).default(""),
  builds: z.array(monsterBuildSchema).length(3),
}).superRefine((input, context) => uniqueBuilds(input.builds, context));

export const createDungeonGuideSchema = z.object({
  dungeonKey: z.string().refine((key) => dungeonByKey.has(key), "던전을 확인해 주세요."),
  title: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(5).max(300),
  strategy: z.string().trim().min(10).max(3000),
  difficulty: z.string().trim().max(40).default(""),
  clearTime: z.string().trim().max(40).default(""),
  builds: z.array(monsterBuildSchema).min(3).max(15),
}).superRefine((input, context) => {
  uniqueBuilds(input.builds, context);
  const dungeon = dungeonByKey.get(input.dungeonKey);
  if (dungeon && input.builds.length !== dungeon.teamSize) {
    context.addIssue({
      code: "custom",
      path: ["builds"],
      message: `${dungeon.name} 공략은 몬스터 ${dungeon.teamSize}마리가 필요합니다.`,
    });
  }
});

export const createHomeworkSchema = z.object({
  title: z.string().trim().min(2).max(80),
  target: z.string().trim().min(4).max(300),
  strategy: z.string().trim().min(10).max(2000),
  dueAt: z.string().datetime().nullable(),
  builds: z.array(homeworkBuildSchema).length(3),
}).superRefine((input, context) => uniqueBuilds(input.builds, context));

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2, "공지 제목을 2자 이상 입력해 주세요.").max(80),
  content: z.string().trim().min(4, "공지 내용을 4자 이상 입력해 주세요.").max(2000),
  pinned: z.boolean().default(false),
});

export const createScheduleSchema = z.object({
  title: z.string().trim().min(2, "일정 제목을 2자 이상 입력해 주세요.").max(80),
  category: z.string().trim().min(1, "일정 종류를 선택해 주세요.").max(30),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable(),
}).superRefine((input, context) => {
  if (input.endsAt && Date.parse(input.endsAt) < Date.parse(input.startsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "종료 시간은 시작 시간보다 늦어야 합니다." });
  }
});

export const createChangeRequestSchema = z.object({
  category: z.enum(["기능 요청", "오류 수정", "내용 수정", "기타"]),
  content: z.string().trim().min(5, "요청 내용을 5자 이상 입력해 주세요.").max(1000),
});

export function canManageGuildContent(role: string) {
  return role === "OWNER" || role === "OFFICER";
}

export function serializeBuild(build: { monsterId: string; position: number; isLeader: boolean; runeSets: string; hp: number | null; attack: number | null; defense: number | null; speed: number | null; critRate: number | null; critDamage: number | null; resistance: number | null; accuracy: number | null; note: string }) {
  return build;
}

export function buildCreateData(build: z.infer<typeof monsterBuildSchema>) {
  return {
    monsterId: build.monsterId,
    position: build.position,
    isLeader: build.isLeader,
    runeSets: build.runeSets,
    hp: build.hp ?? null,
    attack: build.attack ?? null,
    defense: build.defense ?? null,
    speed: build.speed ?? null,
    critRate: build.critRate ?? null,
    critDamage: build.critDamage ?? null,
    resistance: build.resistance ?? null,
    accuracy: build.accuracy ?? null,
    note: build.note,
  };
}

export function homeworkBuildCreateData(build: z.infer<typeof homeworkBuildSchema>) {
  return {
    ...buildCreateData(build),
    artifactLeft: build.artifactLeft,
    artifactRight: build.artifactRight,
  };
}

export function buildHomeworkProgress(
  members: Array<{ id: string; nickname: string; role: string }>,
  completions: Array<{ memberId: string; completedAt: Date }>,
) {
  const completionByMember = new Map(completions.map((completion) => [completion.memberId, completion.completedAt]));
  const completed = members.flatMap((member) => {
    const completedAt = completionByMember.get(member.id);
    return completedAt ? [{ ...member, completedAt: completedAt.toISOString() }] : [];
  });
  const incomplete = members.filter((member) => !completionByMember.has(member.id));
  return { completed, incomplete, total: members.length };
}
