export type Element = "FIRE" | "WATER" | "WIND" | "LIGHT" | "DARK";

export type Monster = {
  id: string;
  displayName: string;
  element: Element;
  grade: 3 | 4 | 5;
  initials: string;
};

export const monsters: Monster[] = [
  { id: "water-inugami", displayName: "물 이누가미", element: "WATER", grade: 3, initials: "이" },
  { id: "fire-oracle", displayName: "불 오라클", element: "FIRE", grade: 5, initials: "오" },
  { id: "wind-griffon", displayName: "바람 그리폰", element: "WIND", grade: 3, initials: "그" },
  { id: "light-fairy", displayName: "빛 페어리", element: "LIGHT", grade: 3, initials: "페" },
  { id: "dark-werewolf", displayName: "어둠 늑대인간", element: "DARK", grade: 3, initials: "늑" },
  { id: "fire-bounty", displayName: "불 바운티헌터", element: "FIRE", grade: 3, initials: "바" },
  { id: "water-paladin", displayName: "물 팔라딘", element: "WATER", grade: 5, initials: "팔" },
  { id: "wind-panda", displayName: "바람 웅묘무사", element: "WIND", grade: 5, initials: "웅" },
  { id: "light-cowgirl", displayName: "빛 카우걸", element: "LIGHT", grade: 3, initials: "카" },
  { id: "dark-vampire", displayName: "어둠 뱀파이어", element: "DARK", grade: 4, initials: "뱀" },
  { id: "fire-sylph", displayName: "불 실프", element: "FIRE", grade: 4, initials: "실" },
  { id: "water-pierret", displayName: "물 피에레트", element: "WATER", grade: 4, initials: "피" },
];

export type Deck = {
  id: string;
  title: string;
  summary: string;
  offenseIds: [string, string, string];
  leaderSlot: 0 | 1 | 2;
  wins: number;
  battles: number;
  recent: string;
  author: string;
  isOfficial: boolean;
  match: "exact" | "partial";
};

export const decks: Deck[] = [
  {
    id: "safe-control",
    title: "안정형 선턴 제어 공덱",
    summary: "속도 리더와 해제 이후 단일 대상을 집중하는 조합입니다.",
    offenseIds: ["water-paladin", "fire-sylph", "wind-panda"],
    leaderSlot: 1,
    wins: 12,
    battles: 15,
    recent: "3일 전",
    author: "태산",
    isOfficial: true,
    match: "exact",
  },
  {
    id: "turn-two",
    title: "후턴 안정 공덱",
    summary: "첫 공격을 버틴 뒤 회복과 반격으로 흐름을 되찾습니다.",
    offenseIds: ["dark-vampire", "water-pierret", "light-cowgirl"],
    leaderSlot: 0,
    wins: 8,
    battles: 11,
    recent: "5일 전",
    author: "마루",
    isOfficial: false,
    match: "exact",
  },
  {
    id: "fast-focus",
    title: "빠른 단일 점사 공덱",
    summary: "방어덱 두 자리가 같은 경우 우선 검토할 수 있는 부분 일치 조합입니다.",
    offenseIds: ["fire-bounty", "wind-griffon", "light-fairy"],
    leaderSlot: 1,
    wins: 5,
    battles: 8,
    recent: "1주 전",
    author: "다온",
    isOfficial: false,
    match: "partial",
  },
];

export const defaultDefenseIds = [
  "water-inugami",
  "fire-oracle",
  "wind-griffon",
] as const;

export function getMonster(id: string) {
  const monster = monsters.find((item) => item.id === id);
  if (!monster) throw new Error(`Monster not found: ${id}`);
  return monster;
}

