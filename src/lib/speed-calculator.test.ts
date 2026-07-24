import { describe, expect, it } from "vitest";
import { calculateCombatSpeed, calculateSpeedTune, type SpeedChainUnit } from "@/lib/speed-calculator";

function unit(overrides: Partial<SpeedChainUnit> = {}): SpeedChainUnit {
  return {
    baseSpeed: 100,
    runeSpeed: null,
    leaderPct: 0,
    towerPct: 15,
    guildLevelPct: 0,
    passiveBonus: 0,
    speedArtifactPct: 0,
    effects: [],
    ...overrides,
  };
}

describe("speed tune calculator", () => {
  it("applies leader, tower, guild level, rune and passive speed separately", () => {
    expect(calculateCombatSpeed(unit({
      baseSpeed: 101,
      runeSpeed: 180,
      leaderPct: 28,
      guildLevelPct: 5,
      passiveBonus: 39,
    }))).toBe(369);
  });

  it.each([
    { baseSpeed: 93, leaderPct: 0, runeSpeeds: [179, 132, 98, 72], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 0, runeSpeeds: [169, 122, 88, 62], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 19, runeSpeeds: [150, 103, 69, 43], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 23, runeSpeeds: [146, 99, 65, 39], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 24, runeSpeeds: [145, 98, 64, 38], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 28, runeSpeeds: [141, 94, 60, 34], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 30, runeSpeeds: [139, 92, 58, 32], ticks: [5, 6, 7, 8] },
    { baseSpeed: 101, leaderPct: 33, runeSpeeds: [136, 89, 55, 29], ticks: [5, 6, 7, 8] },
    { baseSpeed: 110, leaderPct: 0, runeSpeeds: [159, 112, 78, 52], ticks: [5, 6, 7, 8] },
  ])("matches the tick table for base speed $baseSpeed with $leaderPct% leader", ({ baseSpeed, leaderPct, runeSpeeds, ticks }) => {
    for (const [index, runeSpeed] of runeSpeeds.entries()) {
      const result = calculateSpeedTune([
        unit({ baseSpeed, leaderPct, runeSpeed }),
        unit(),
      ]);
      const belowBoundary = calculateSpeedTune([
        unit({ baseSpeed, leaderPct, runeSpeed: runeSpeed - 1 }),
        unit(),
      ]);

      expect(result.firstTurnTick).toBe(ticks[index]);
      expect(belowBoundary.firstTurnTick).toBe(ticks[index] + 1);
    }
  });

  it("adds the guild level bonus to base speed only", () => {
    const withoutGuildBonus = calculateCombatSpeed(unit({ baseSpeed: 100, runeSpeed: 200, leaderPct: 24 }));
    const withGuildBonus = calculateCombatSpeed(unit({
      baseSpeed: 100,
      runeSpeed: 200,
      leaderPct: 24,
      guildLevelPct: 5,
    }));

    expect(withoutGuildBonus).toBe(339);
    expect(withGuildBonus).toBe(344);
  });

  it("applies the guild speed bonus before the combat-speed roundup", () => {
    const withoutGuildBonus = calculateSpeedTune([
      unit({ baseSpeed: 100, leaderPct: 24, runeSpeed: 146 }),
      unit(),
    ]);
    const withGuildBonus = calculateSpeedTune([
      unit({ baseSpeed: 100, leaderPct: 24, guildLevelPct: 5, runeSpeed: 141 }),
      unit(),
    ]);

    expect(withoutGuildBonus.leadCombatSpeed).toBe(285);
    expect(withoutGuildBonus.firstTurnTick).toBe(6);
    expect(withGuildBonus.leadCombatSpeed).toBe(285);
    expect(withGuildBonus.firstTurnTick).toBe(6);

    const guildTickBoundary = calculateSpeedTune([
      unit({ baseSpeed: 100, leaderPct: 24, guildLevelPct: 5, runeSpeed: 142 }),
      unit(),
    ]);
    expect(guildTickBoundary.leadCombatSpeed).toBe(286);
    expect(guildTickBoundary.firstTurnTick).toBe(5);
  });

  it("matches the ryhlab water pumpkin example", () => {
    const result = calculateSpeedTune([
      unit({
        baseSpeed: 101,
        runeSpeed: 180,
        leaderPct: 28,
        passiveBonus: 39,
        effects: [{ type: "speed_buff", amount: 0, targets: [1, 2] }],
      }),
      unit({ baseSpeed: 101, leaderPct: 28 }),
      unit({ baseSpeed: 120, leaderPct: 28 }),
    ]);

    expect(result.positions.map((position) => position.minimumRuneSpeed)).toEqual([180, 199, 159]);
    expect(result.positions.map((position) => Math.ceil(position.minimumCombatSpeed))).toEqual([364, 344, 331]);
  });

  it("lowers the required back speed when attack bar is increased", () => {
    const withoutBoost = calculateSpeedTune([
      unit({ runeSpeed: 200, effects: [{ type: "speed_buff", amount: 0, targets: [1, 2] }] }),
      unit(),
      unit(),
    ]);
    const withBoost = calculateSpeedTune([
      unit({ runeSpeed: 200, effects: [{ type: "atb_increase", amount: 30, targets: [1, 2] }] }),
      unit(),
      unit(),
    ]);

    expect(withBoost.positions[1].minimumRuneSpeed).toBeLessThan(withoutBoost.positions[1].minimumRuneSpeed);
    expect(withBoost.positions[1].receivedGaugePct).toBe(30);
  });
});
