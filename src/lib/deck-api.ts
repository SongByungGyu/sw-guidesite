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

export function createCombinationKey(ids: readonly string[]) {
  return [...ids].sort((left, right) => left.localeCompare(right)).join(":");
}
