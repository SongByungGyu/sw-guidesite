import { MonsterPortrait } from "@/components/monster-portrait";
import type { Monster } from "@/lib/mock-data";

type TeamCompositionProps = {
  monsters: Monster[];
  leaderSlot?: number;
  label: string;
  compact?: boolean;
};

export function TeamComposition({
  monsters,
  leaderSlot,
  label,
  compact = false,
}: TeamCompositionProps) {
  return (
    <div className="team-composition" aria-label={label}>
      {monsters.map((monster, index) => (
        <MonsterPortrait
          compact={compact}
          key={monster.id}
          leader={leaderSlot === index}
          monster={monster}
        />
      ))}
    </div>
  );
}

