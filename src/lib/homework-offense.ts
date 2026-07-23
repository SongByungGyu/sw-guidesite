import type {
  GuildOffenseGuide,
  GuildOffenseMonsterGuide,
  GuildOffenseStatKey,
} from "@/lib/guild-offense-guides";
import { getMonster } from "@/lib/monster-data";

export type HomeworkOffenseBuild = {
  monsterId: string;
  position: number;
  isLeader: boolean;
  runeSets: string;
  hp: number | null;
  attack: number | null;
  defense: number | null;
  speed: number | null;
  critRate: number | null;
  critDamage: number | null;
  resistance: number | null;
  accuracy: number | null;
  artifactLeft?: string;
  artifactRight?: string;
  note: string;
};

export type HomeworkOffense = {
  id: string;
  title: string;
  target: string;
  strategy: string;
  dueAt?: string;
  status: string;
  author: string;
  updatedAt: string;
  monsters: HomeworkOffenseBuild[];
};

const statKeys: GuildOffenseStatKey[] = [
  "hp",
  "attack",
  "defense",
  "speed",
  "critRate",
  "critDamage",
  "resistance",
  "accuracy",
];

export function createHomeworkOffenseGuide(homework: HomeworkOffense): GuildOffenseGuide {
  const monsters = homework.monsters
    .slice()
    .sort((left, right) => left.position - right.position)
    .map(toMonsterGuide);

  if (monsters.length !== 3) {
    throw new Error("숙제 연동 공덱은 몬스터 3마리가 필요합니다.");
  }

  const strategy = homework.strategy
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dueLabel = homework.dueAt
    ? `${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(homework.dueAt))} 마감`
    : "기한 없음";

  return {
    id: `homework-${homework.id}`,
    title: homework.title,
    summary: `추천 대상 · ${homework.target}`,
    badge: "숙제 연동",
    source: "homework",
    monsters: monsters as GuildOffenseGuide["monsters"],
    strategy: strategy.length ? strategy : ["숙제에 등록된 운용 지시를 확인해 주세요."],
    note: `작성 ${homework.author} · ${dueLabel} · 숙제를 수정하면 이 공덱도 자동으로 갱신됩니다.`,
  };
}

function toMonsterGuide(build: HomeworkOffenseBuild): GuildOffenseMonsterGuide {
  const values = Object.fromEntries(statKeys.map((key) => [key, formatStat(key, build[key])])) as Record<GuildOffenseStatKey, string>;
  return {
    monsterId: build.monsterId,
    roleName: getMonster(build.monsterId).displayName,
    isLeader: build.isLeader,
    leaderNote: build.isLeader ? "숙제 지정 리더" : undefined,
    runeSets: build.runeSets || "룬 정보 없음",
    stats: values,
    artifactLeft: build.artifactLeft?.trim() || "상관없음",
    artifactRight: build.artifactRight?.trim() || "상관없음",
  };
}

function formatStat(key: GuildOffenseStatKey, value: number | null) {
  if (value === null) return "상관없음";
  if (key === "critRate" || key === "critDamage" || key === "resistance" || key === "accuracy") return `${value}%`;
  return `+${new Intl.NumberFormat("ko-KR").format(value)}`;
}
