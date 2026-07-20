export { getMonster, monsters } from "@/lib/monster-data";
export type { Element, Monster } from "@/lib/monster-data";

export type Deck = {
  id: string;
  title: string;
  summary: string;
  defenseIds: [string, string, string];
  offenseIds: [string, string, string];
  leaderSlot: 0 | 1 | 2;
  wins: number;
  battles: number;
  recent: string;
  updatedAt: string;
  author: string;
  isOfficial: boolean;
};

export const decks: Deck[] = [
  {
    id: "safe-control",
    title: "안정형 선턴 제어 공덱",
    summary: "속도 리더와 해제 이후 단일 대상을 집중하는 조합입니다.",
    defenseIds: ["2013", "1105", "3012"],
    offenseIds: ["2120", "1303", "3118"],
    leaderSlot: 1,
    wins: 12,
    battles: 15,
    recent: "3일 전",
    updatedAt: "2026-07-17T09:00:00+09:00",
    author: "태산",
    isOfficial: true,
  },
  {
    id: "turn-two",
    title: "후턴 안정 공덱",
    summary: "첫 공격을 버틴 뒤 회복과 반격으로 흐름을 되찾습니다.",
    defenseIds: ["3012", "2013", "1105"],
    offenseIds: ["5106", "2308", "4519"],
    leaderSlot: 0,
    wins: 8,
    battles: 11,
    recent: "5일 전",
    updatedAt: "2026-07-15T18:30:00+09:00",
    author: "마루",
    isOfficial: false,
  },
  {
    id: "fast-focus",
    title: "빠른 단일 점사 공덱",
    summary: "방어덱 두 자리가 같은 경우 우선 검토할 수 있는 부분 일치 조합입니다.",
    defenseIds: ["2013", "3012", "4017"],
    offenseIds: ["1509", "3012", "4017"],
    leaderSlot: 1,
    wins: 5,
    battles: 8,
    recent: "1주 전",
    updatedAt: "2026-07-11T12:00:00+09:00",
    author: "다온",
    isOfficial: false,
  },
];

export const defaultDefenseIds = [
  "2013",
  "1105",
  "3012",
] as const;
