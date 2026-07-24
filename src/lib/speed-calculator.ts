export type SpeedEffectType = "speed_buff" | "atb_increase";

export type AppliedSpeedEffect = {
  type: SpeedEffectType;
  amount: number;
  targets: number[];
};

export type SpeedChainUnit = {
  baseSpeed: number;
  runeSpeed: number | null;
  leaderPct: number;
  towerPct: number;
  guildLevelPct: number;
  passiveBonus: number;
  speedArtifactPct: number;
  effects: AppliedSpeedEffect[];
};

export type SpeedPositionResult = {
  position: number;
  baseSpeed: number;
  minimumRuneSpeed: number;
  minimumCombatSpeed: number;
  actualRuneSpeed: number | null;
  actualCombatSpeed: number | null;
  receivedGaugePct: number;
  receivesSpeedBuff: boolean;
};

export type SpeedTuneResult = {
  firstTurnTick: number;
  leadCombatSpeed: number;
  positions: SpeedPositionResult[];
  recommendedOrder: number[];
  actualOrder: number[] | null;
  actualSafe: boolean | null;
};

type EffectState = {
  atbIncrease: number;
  speedBuffStart: number;
};

const GAUGE_PER_SPEED = 0.07;
const SPEED_BUFF_PCT = 30;

export function calculateCombatSpeed(unit: SpeedChainUnit, runeSpeed = unit.runeSpeed ?? 0) {
  // 게임은 리더·건물·길드·고정 공속을 합산한 전투 공속을 올림한 뒤 ATB 틱에 사용합니다.
  return Math.ceil(
    unit.baseSpeed * (1 + (unit.leaderPct + unit.towerPct + unit.guildLevelPct) / 100)
      + runeSpeed
      + unit.passiveBonus,
  );
}

export function calculateSpeedTune(units: SpeedChainUnit[]): SpeedTuneResult {
  if (units.length < 2) throw new Error("At least two monsters are required.");
  const leadRuneSpeed = units[0].runeSpeed ?? 0;
  const leadCombatSpeed = calculateCombatSpeed(units[0], leadRuneSpeed);
  const leadGaugePerTick = GAUGE_PER_SPEED * leadCombatSpeed;
  const firstTurnTick = leadGaugePerTick > 0 ? Math.floor(100 / leadGaugePerTick) + 1 : 0;
  const effectStates = units.map<EffectState>(() => ({ atbIncrease: 0, speedBuffStart: -1 }));
  const minimumRuneSpeeds = units.map(() => 0);
  const minimumCombatSpeeds = units.map(() => 0);
  minimumRuneSpeeds[0] = leadRuneSpeed;
  minimumCombatSpeeds[0] = leadCombatSpeed;
  const hasAnyEffect = units.some((unit) => unit.effects.length > 0);

  for (let position = 0; position < units.length; position += 1) {
    if (position > 0) {
      const unit = units[position];
      let requiredCombatSpeed: number;
      if (!hasAnyEffect) {
        requiredCombatSpeed = Math.max(0, Math.ceil(minimumCombatSpeeds[position - 1]) - 1);
      } else {
        const state = effectStates[position];
        const actionTick = firstTurnTick + position;
        const buffedTicks = state.speedBuffStart >= 0
          ? Math.max(0, position - state.speedBuffStart)
          : 0;
        const buffMultiplier = state.speedBuffStart >= 0
          ? SPEED_BUFF_PCT / 100 * (1 + unit.speedArtifactPct / 100)
          : 0;
        const effectiveTicks = actionTick + buffedTicks * buffMultiplier;
        requiredCombatSpeed = effectiveTicks > 0
          ? Math.max(0, (leadGaugePerTick * actionTick - state.atbIncrease) / (GAUGE_PER_SPEED * effectiveTicks))
          : 0;
      }
      const baseCombatSpeed = calculateCombatSpeed(unit, 0);
      minimumRuneSpeeds[position] = Math.max(0, Math.ceil(requiredCombatSpeed - baseCombatSpeed - 1e-9));
      minimumCombatSpeeds[position] = calculateCombatSpeed(unit, minimumRuneSpeeds[position]);
    }

    applyEffects(units[position].effects, position, effectStates, (target) => target > position);
  }

  for (let position = units.length - 2; position >= 1; position -= 1) {
    while (Math.ceil(minimumCombatSpeeds[position]) <= Math.ceil(minimumCombatSpeeds[position + 1])) {
      minimumRuneSpeeds[position] += 1;
      minimumCombatSpeeds[position] = calculateCombatSpeed(units[position], minimumRuneSpeeds[position]);
    }
  }

  const recommendedOrder = simulateOrder(units, minimumRuneSpeeds);
  const allActualSpeedsEntered = units.every((unit) => unit.runeSpeed !== null);
  const actualRuneSpeeds = units.map((unit) => unit.runeSpeed ?? 0);
  const actualOrder = allActualSpeedsEntered ? simulateOrder(units, actualRuneSpeeds) : null;
  const actualSafe = actualOrder
    ? actualOrder.every((position, index) => position === index)
      && actualRuneSpeeds.slice(1).every((speed, index) => speed >= minimumRuneSpeeds[index + 1])
    : null;

  return {
    firstTurnTick,
    leadCombatSpeed,
    positions: units.map((unit, position) => ({
      position,
      baseSpeed: unit.baseSpeed,
      minimumRuneSpeed: minimumRuneSpeeds[position],
      minimumCombatSpeed: minimumCombatSpeeds[position],
      actualRuneSpeed: unit.runeSpeed,
      actualCombatSpeed: unit.runeSpeed === null ? null : calculateCombatSpeed(unit, unit.runeSpeed),
      receivedGaugePct: effectStates[position].atbIncrease,
      receivesSpeedBuff: effectStates[position].speedBuffStart >= 0,
    })),
    recommendedOrder,
    actualOrder,
    actualSafe,
  };
}

function applyEffects(
  effects: AppliedSpeedEffect[],
  stage: number,
  states: EffectState[],
  canReceive: (target: number) => boolean,
) {
  for (const effect of effects) {
    for (const target of effect.targets) {
      if (target < 0 || target >= states.length || !canReceive(target)) continue;
      if (effect.type === "speed_buff") {
        if (states[target].speedBuffStart < 0) states[target].speedBuffStart = stage;
      } else {
        states[target].atbIncrease += Math.max(0, effect.amount);
      }
    }
  }
}

function simulateOrder(units: SpeedChainUnit[], runeSpeeds: number[]) {
  const combatSpeeds = units.map((unit, position) => calculateCombatSpeed(unit, runeSpeeds[position]));
  const fastestCombatSpeed = Math.max(...combatSpeeds);
  const firstTurnTick = fastestCombatSpeed > 0
    ? Math.floor(100 / (GAUGE_PER_SPEED * fastestCombatSpeed)) + 1
    : 0;
  const states = units.map<EffectState>(() => ({ atbIncrease: 0, speedBuffStart: -1 }));
  const remaining = new Set(units.map((_, position) => position));
  const order: number[] = [];

  for (let stage = 0; stage < units.length; stage += 1) {
    const tick = firstTurnTick + stage;
    const actor = [...remaining].sort((left, right) => {
      const rightGauge = gaugeAt(units[right], combatSpeeds[right], states[right], stage, tick);
      const leftGauge = gaugeAt(units[left], combatSpeeds[left], states[left], stage, tick);
      return rightGauge - leftGauge || combatSpeeds[right] - combatSpeeds[left] || left - right;
    })[0];
    order.push(actor);
    remaining.delete(actor);
    applyEffects(units[actor].effects, stage, states, (target) => remaining.has(target));
  }

  return order;
}

function gaugeAt(unit: SpeedChainUnit, combatSpeed: number, state: EffectState, stage: number, tick: number) {
  const buffedTicks = state.speedBuffStart >= 0 ? Math.max(0, stage - state.speedBuffStart) : 0;
  const buffMultiplier = state.speedBuffStart >= 0
    ? SPEED_BUFF_PCT / 100 * (1 + unit.speedArtifactPct / 100)
    : 0;
  return GAUGE_PER_SPEED * combatSpeed * (tick + buffedTicks * buffMultiplier) + state.atbIncrease;
}
