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
  persisted?: boolean;
  strategy?: string;
  minimumRequirements?: string;
  caution?: string;
};
