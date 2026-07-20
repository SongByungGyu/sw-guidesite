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
  builds: z.array(monsterBuildSchema).length(3),
}).superRefine((input, context) => uniqueBuilds(input.builds, context));

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
