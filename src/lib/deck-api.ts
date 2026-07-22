import { z } from "zod";
import { monsters } from "@/lib/monster-data";

const monsterIds = new Set(monsters.map((monster) => monster.id));

const teamSchema = z.array(z.string()).length(3).superRefine((ids, context) => {
  if (new Set(ids).size !== 3) {
    context.addIssue({ code: "custom", message: "서로 다른 몬스터 3마리를 선택해 주세요." });
  }
  if (ids.some((id) => !monsterIds.has(id))) {
    context.addIssue({ code: "custom", message: "몬스터 정보를 다시 확인해 주세요." });
  }
});

export const createOffenseDeckSchema = z.object({
  defenseIds: teamSchema,
  offenseIds: teamSchema,
  leaderSlot: z.number().int().min(0).max(2),
  title: z.string().trim().max(60),
  strategy: z.string().trim().max(2000),
  minimumRequirements: z.string().trim().max(1000).default(""),
  caution: z.string().trim().max(1000).default(""),
  status: z.enum(["draft", "published"]),
}).superRefine((input, context) => {
  if (input.status === "published" && input.title.length < 2) {
    context.addIssue({ code: "custom", path: ["title"], message: "제목은 두 글자 이상 입력해 주세요." });
  }
  if (input.status === "published" && input.strategy.length < 10) {
    context.addIssue({ code: "custom", path: ["strategy"], message: "운용법을 10자 이상 입력해 주세요." });
  }
});

export const recordMetaDefenseSchema = z.object({
  towerGrade: z.union([z.literal(4), z.literal(5)]),
  monsterIds: teamSchema,
}).superRefine((input, context) => {
  if (input.towerGrade === 4 && input.monsterIds.some((id) => monsters.find((monster) => monster.id === id)?.grade === 5)) {
    context.addIssue({
      code: "custom",
      path: ["monsterIds"],
      message: "4성 거점에는 태생 5성 몬스터를 기록할 수 없습니다.",
    });
  }
});

export type MetaDefenseAggregate = {
  towerGrade: 4 | 5;
  combinationKey: string;
  monsterIds: [string, string, string];
  recordCount: number;
  lastRecordedOn: string;
};

export function buildMetaDefenseTop(records: Array<{
  towerGrade: number;
  combinationKey: string;
  monsterIds: string[];
  recordedOn: Date;
}>, limit = 5) {
  const grouped = new Map<string, MetaDefenseAggregate>();
  for (const record of records) {
    if (record.towerGrade !== 4 && record.towerGrade !== 5) continue;
    if (record.monsterIds.length !== 3) continue;
    const key = `${record.towerGrade}:${record.combinationKey}`;
    const recordedOn = record.recordedOn.toISOString();
    const current = grouped.get(key);
    if (current) {
      current.recordCount += 1;
      if (recordedOn > current.lastRecordedOn) current.lastRecordedOn = recordedOn;
    } else {
      grouped.set(key, {
        towerGrade: record.towerGrade,
        combinationKey: record.combinationKey,
        monsterIds: record.monsterIds as [string, string, string],
        recordCount: 1,
        lastRecordedOn: recordedOn,
      });
    }
  }

  const sortRows = (left: MetaDefenseAggregate, right: MetaDefenseAggregate) => (
    right.recordCount - left.recordCount
    || right.lastRecordedOn.localeCompare(left.lastRecordedOn)
    || left.combinationKey.localeCompare(right.combinationKey)
  );

  return {
    fiveStar: [...grouped.values()].filter((row) => row.towerGrade === 5).sort(sortRows).slice(0, limit),
    fourStar: [...grouped.values()].filter((row) => row.towerGrade === 4).sort(sortRows).slice(0, limit),
  };
}

export function createCombinationKey(ids: readonly string[]) {
  return [...ids].sort((left, right) => left.localeCompare(right)).join(":");
}
