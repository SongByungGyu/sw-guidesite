import { describe, expect, it } from "vitest";
import { calculateCombatSpeed, calculateSpeedTune, type SpeedChainUnit } from "@/lib/speed-calculator";

function unit(overrides: Partial<SpeedChainUnit> = {}): SpeedChainUnit {
  return {
    baseSpeed: 100,
    runeSpeed: null,
    leaderPct: 0,
    towerPct: 15,
    passiveBonus: 0,
    speedArtifactPct: 0,
    effects: [],
    ...overrides,
  };
}

describe("speed tune calculator", () => {
  it("applies leader, tower, rune and passive speed separately", () => {
    expect(calculateCombatSpeed(unit({ baseSpeed: 101, runeSpeed: 180, leaderPct: 28, passiveBonus: 39 })))
      .toBeCloseTo(363.43, 5);
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
