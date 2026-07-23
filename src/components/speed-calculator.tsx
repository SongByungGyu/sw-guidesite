"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { getMonster } from "@/lib/monster-data";
import {
  calculateSpeedTune,
  type AppliedSpeedEffect,
  type SpeedChainUnit,
} from "@/lib/speed-calculator";

type SpeedLeader = { amount: number; area: string; element: string } | null;
type SkillEffect = { type: "speed_buff" | "atb_increase"; target: string; amount: number };
type SpeedSkill = { skillSlot: number; skillName: string; effects: SkillEffect[] };
type SpeedMonsterData = { baseSpeed: number; speedLeader: SpeedLeader; skills: SpeedSkill[] };

export type SpeedCalculatorDataset = {
  sourceName: string;
  sourceUrl: string;
  sourceUpdatedAt: string;
  towerSpeedPct: number;
  count: number;
  automaticSkillMonsterCount: number;
  monsters: Record<string, SpeedMonsterData>;
};

type EffectMode = "auto" | "custom" | "none";
type EffectDraft = {
  mode: EffectMode;
  skillSlot: number;
  target: string;
  gauge: string;
  speedBuff: boolean;
};

type SavedSpeedCalculatorDraft = {
  teamIds: string[];
  leaderSlot: number | null;
  battleArea: "guild" | "arena";
  manualLeaderPct: string;
  towerPct: string;
  runeSpeeds: string[];
  artifactPcts: string[];
  passiveBonuses: string[];
  pumpkinBuffCounts: string[];
  effectOverrides: Record<string, EffectDraft>;
};

const EMPTY_TEAM = ["", "", ""];
const WATER_PUMPKIN_ID = "2330";
const SPEED_DRAFT_KEY = "guild_archive_speed_calculator:v1";

export function SpeedCalculator({ speedData }: { speedData: SpeedCalculatorDataset }) {
  const [teamIds, setTeamIds] = useState(EMPTY_TEAM);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [leaderSlot, setLeaderSlot] = useState<number | null>(null);
  const [battleArea, setBattleArea] = useState<"guild" | "arena">("guild");
  const [manualLeaderPct, setManualLeaderPct] = useState("");
  const [towerPct, setTowerPct] = useState(String(speedData.towerSpeedPct));
  const [runeSpeeds, setRuneSpeeds] = useState(["", "", ""]);
  const [artifactPcts, setArtifactPcts] = useState(["0", "0", "0"]);
  const [passiveBonuses, setPassiveBonuses] = useState(["0", "0", "0"]);
  const [pumpkinBuffCounts, setPumpkinBuffCounts] = useState(["2", "2", "2"]);
  const [effectOverrides, setEffectOverrides] = useState<Record<string, EffectDraft>>({});
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const restoreFrame = window.requestAnimationFrame(() => {
      try {
        const rawDraft = window.localStorage.getItem(SPEED_DRAFT_KEY);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft) as Partial<SavedSpeedCalculatorDraft>;
          const restoredTeam = savedStringList(draft.teamIds, EMPTY_TEAM)
            .map((id) => id && speedData.monsters[id] ? id : "");
          const restoredLeader = typeof draft.leaderSlot === "number"
            && draft.leaderSlot >= 0
            && draft.leaderSlot < restoredTeam.length
            && Boolean(speedData.monsters[restoredTeam[draft.leaderSlot]]?.speedLeader)
            ? draft.leaderSlot
            : restoredTeam.findIndex((id) => Boolean(speedData.monsters[id]?.speedLeader));
          setTeamIds(restoredTeam);
          setLeaderSlot(restoredLeader >= 0 ? restoredLeader : null);
          if (draft.battleArea === "guild" || draft.battleArea === "arena") setBattleArea(draft.battleArea);
          if (typeof draft.manualLeaderPct === "string") setManualLeaderPct(draft.manualLeaderPct);
          if (typeof draft.towerPct === "string") setTowerPct(draft.towerPct);
          setRuneSpeeds(savedStringList(draft.runeSpeeds, ["", "", ""]));
          setArtifactPcts(savedStringList(draft.artifactPcts, ["0", "0", "0"]));
          setPassiveBonuses(savedStringList(draft.passiveBonuses, ["0", "0", "0"]));
          setPumpkinBuffCounts(savedStringList(draft.pumpkinBuffCounts, ["2", "2", "2"]));
          if (isRecord(draft.effectOverrides)) setEffectOverrides(draft.effectOverrides as Record<string, EffectDraft>);
        }
      } catch {
        try { window.localStorage.removeItem(SPEED_DRAFT_KEY); } catch { /* 저장소를 사용할 수 없는 환경은 메모리 상태만 유지합니다. */ }
      } finally {
        setDraftReady(true);
      }
    });
    return () => window.cancelAnimationFrame(restoreFrame);
  }, [speedData.monsters]);

  useEffect(() => {
    if (!draftReady) return;
    const draft: SavedSpeedCalculatorDraft = {
      teamIds,
      leaderSlot,
      battleArea,
      manualLeaderPct,
      towerPct,
      runeSpeeds,
      artifactPcts,
      passiveBonuses,
      pumpkinBuffCounts,
      effectOverrides,
    };
    try { window.localStorage.setItem(SPEED_DRAFT_KEY, JSON.stringify(draft)); } catch { /* 저장소를 사용할 수 없는 환경은 메모리 상태만 유지합니다. */ }
  }, [artifactPcts, battleArea, draftReady, effectOverrides, leaderSlot, manualLeaderPct, passiveBonuses, pumpkinBuffCounts, runeSpeeds, teamIds, towerPct]);

  const selectedCount = teamIds.filter(Boolean).length;
  const leaderId = leaderSlot === null ? "" : teamIds[leaderSlot];
  const leaderMonster = leaderId ? getMonster(leaderId) : null;
  const leaderData = leaderId ? speedData.monsters[leaderId] : undefined;
  const automaticLeaderLabel = leaderMonster
    ? describeLeader(leaderData?.speedLeader ?? null, battleArea, leaderMonster.element)
    : { amount: 0, label: selectedCount ? "선택한 조합에 공속 리더 없음" : "몬스터 선택 후 자동 적용" };
  const effectDrafts = teamIds.slice(0, 2).map((id, position) => getEffectDraft(
    speedData.monsters[id],
    effectOverrides[`${position}:${id}`],
    position,
  ));

  const units = useMemo<SpeedChainUnit[] | null>(() => {
    if (!teamIds.every(Boolean)) return null;
    return teamIds.map((id, position) => {
    const monster = getMonster(id);
    const data = speedData.monsters[id];
    const leaderPct = manualLeaderPct.trim() === ""
      ? automaticLeaderForUnit(leaderData?.speedLeader ?? null, battleArea, leaderMonster?.element ?? "", monster.element)
      : numeric(manualLeaderPct);
    const passiveBonus = id === WATER_PUMPKIN_ID
      ? numeric(pumpkinBuffCounts[position]) * 19.5
      : numeric(passiveBonuses[position]);
    return {
      baseSpeed: data?.baseSpeed ?? 0,
      runeSpeed: runeSpeeds[position].trim() === "" ? null : numeric(runeSpeeds[position]),
      leaderPct,
      towerPct: numeric(towerPct),
      passiveBonus,
      speedArtifactPct: numeric(artifactPcts[position]),
      effects: position < 2
        ? resolveEffects(data?.skills ?? [], effectDrafts[position], position, teamIds.length)
        : [],
    };
    });
  }, [artifactPcts, battleArea, effectDrafts, leaderData?.speedLeader, leaderMonster?.element, manualLeaderPct, passiveBonuses, pumpkinBuffCounts, runeSpeeds, speedData.monsters, teamIds, towerPct]);

  const result = useMemo(() => units ? calculateSpeedTune(units) : null, [units]);
  const allActualEntered = Boolean(result?.actualOrder);

  function updateList(setter: React.Dispatch<React.SetStateAction<string[]>>, position: number, value: string) {
    setter((current) => current.map((item, index) => index === position ? value : item));
  }

  function updateEffect(position: number, draft: EffectDraft) {
    setEffectOverrides((current) => ({ ...current, [`${position}:${teamIds[position]}`]: draft }));
  }

  function selectTeam(ids: string[]) {
    setTeamIds(ids);
    setManualLeaderPct("");
    setLeaderSlot((current) => {
      if (current !== null && speedData.monsters[ids[current]]?.speedLeader) return current;
      const automaticSlot = ids.findIndex((id) => Boolean(speedData.monsters[id]?.speedLeader));
      return automaticSlot >= 0 ? automaticSlot : null;
    });
  }

  function resetCalculator() {
    if (selectedCount && !window.confirm("저장된 몬스터 조합과 공속 입력값을 모두 초기화할까요?")) return;
    try { window.localStorage.removeItem(SPEED_DRAFT_KEY); } catch { /* 저장소를 사용할 수 없는 환경은 메모리 상태만 초기화합니다. */ }
    setTeamIds(EMPTY_TEAM);
    setLeaderSlot(null);
    setBattleArea("guild");
    setManualLeaderPct("");
    setTowerPct(String(speedData.towerSpeedPct));
    setRuneSpeeds(["", "", ""]);
    setArtifactPcts(["0", "0", "0"]);
    setPassiveBonuses(["0", "0", "0"]);
    setPumpkinBuffCounts(["2", "2", "2"]);
    setEffectOverrides({});
  }

  return (
    <AppShell activeSection="speed">
      <div className="page-heading speed-heading">
        <div>
          <p className="eyebrow">SPEED TUNING</p>
          <h1>공속 순서 계산기</h1>
          <p>세 마리를 행동 순서대로 고르면 물호박 패시브, 게이지 증가, 공속 버프와 아티 효과까지 반영해 안전한 뒷속을 계산합니다.</p>
        </div>
        <div className="speed-heading-actions">
          <button className="button secondary" onClick={resetCalculator} type="button"><Icon name="x" size={16} /> 입력 초기화</button>
          <a className="button secondary" href={speedData.sourceUrl} rel="noreferrer" target="_blank">
            계산 기준 보기 <Icon name="chevron" size={16} />
          </a>
        </div>
      </div>

      <section className="speed-formula-note">
        <Icon name="bolt" size={19} />
        <div><strong>점령전 기본값 · 자동 임시 저장</strong><p>공속 건물 15%와 7% 게이지 틱을 기준으로 계산합니다. 입력 내용은 이 기기에 자동 저장되어 다시 들어와도 복원됩니다.</p></div>
        <span>자동 스킬 {speedData.automaticSkillMonsterCount}마리</span>
      </section>

      <div className="speed-calculator-layout">
        <div className="speed-config-column">
          <section className="speed-panel">
            <header className="speed-panel-heading"><div><span>1</span><div><h2>행동 순서와 리더</h2><p>빈 칸을 눌러 1턴 → 2턴 → 3턴 순서로 몬스터를 선택하세요.</p></div></div></header>
            <div className="speed-team-picker">
              {teamIds.map((id, position) => {
                if (!id) return <article className="is-empty" key={`empty-${position}`}>
                  <button aria-label={`${position + 1}턴 몬스터 선택`} onClick={() => setEditingSlot(position)} type="button">
                    <span>{position + 1}턴</span>
                    <span className="speed-empty-monster"><Icon name="plus" size={19} /></span>
                    <div><strong>몬스터 선택</strong><small>눌러서 추가하세요</small></div>
                    <Icon name="chevron" size={15} />
                  </button>
                  <div className="speed-no-leader">선택 대기</div>
                </article>;
                const monster = getMonster(id);
                const data = speedData.monsters[id];
                const speedLeader = data?.speedLeader;
                return <article className={leaderSlot === position ? "is-leader" : ""} key={`${id}-${position}`}>
                  <button aria-label={`${position + 1}턴 ${monster.displayName} 변경`} onClick={() => setEditingSlot(position)} type="button">
                    <span>{position + 1}턴</span>
                    <MonsterPortrait compact monster={monster} selected />
                    <div><strong>{monster.displayName}</strong><small>기본속 {data?.baseSpeed ?? "-"}{id === WATER_PUMPKIN_ID ? " · 물호박 자동 감지" : ""}</small></div>
                    <Icon name="edit" size={15} />
                  </button>
                  {speedLeader ? <label><input checked={leaderSlot === position} name="speed-leader" onChange={() => { setLeaderSlot(position); setManualLeaderPct(""); }} type="radio" /> 공속 리더 +{speedLeader.amount}%</label> : <div className="speed-no-leader">공속 리더 없음</div>}
                </article>;
              })}
            </div>
            {selectedCount ? <div className="speed-global-fields">
              <label><span>전투 지역</span><select onChange={(event) => { setBattleArea(event.target.value as "guild" | "arena"); setManualLeaderPct(""); }} value={battleArea}><option value="guild">점령전·길드전</option><option value="arena">아레나</option></select></label>
              <label><span>속도 리더 보정</span><div className="speed-input-suffix"><input max="50" min="0" onChange={(event) => setManualLeaderPct(event.target.value)} placeholder={String(automaticLeaderLabel.amount)} type="number" value={manualLeaderPct} /><b>%</b></div><small>{manualLeaderPct === "" ? automaticLeaderLabel.label : "직접 입력값 적용"}</small></label>
              <label><span>공속 건물</span><div className="speed-input-suffix"><input max="15" min="0" onChange={(event) => setTowerPct(event.target.value)} type="number" value={towerPct} /><b>%</b></div><small>최대 레벨 기본 15%</small></label>
            </div> : null}
          </section>

          {result && units ? <><section className="speed-panel">
            <header className="speed-panel-heading"><div><span>2</span><div><h2>몬스터별 공속</h2><p>룬 상세 화면의 초록색 추가 공속을 입력하세요. 빈 뒷속은 권장값만 계산합니다.</p></div></div></header>
            <div className="speed-stat-cards">
              {teamIds.map((id, position) => {
                const monster = getMonster(id);
                const positionResult = result.positions[position];
                const leaderApplied = units[position].leaderPct;
                return <article key={`${id}-speed-${position}`}>
                  <header><MonsterPortrait compact monster={monster} leader={leaderSlot === position} /><div><span>{position + 1}턴</span><strong>{monster.displayName}</strong></div><em>기본 {units[position].baseSpeed}</em></header>
                  <div className="speed-card-fields">
                    <label><span>룬 추가 공속</span><div className="speed-input-prefix"><b>+</b><input min="0" onChange={(event) => updateList(setRuneSpeeds, position, event.target.value)} placeholder={position === 0 ? "180" : `권장 ${positionResult.minimumRuneSpeed}`} type="number" value={runeSpeeds[position]} /></div></label>
                    <label><span>공속 증가 아티</span><div className="speed-input-suffix"><input max="30" min="0" onChange={(event) => updateList(setArtifactPcts, position, event.target.value)} type="number" value={artifactPcts[position]} /><b>%</b></div></label>
                    {id === WATER_PUMPKIN_ID ? <label className="span-full"><span>물호박 시작 버프</span><select onChange={(event) => updateList(setPumpkinBuffCounts, position, event.target.value)} value={pumpkinBuffCounts[position]}><option value="0">없음 · 추가속 0</option><option value="1">1개 · 추가속 19.5</option><option value="2">2개 · 추가속 39</option></select></label> : <label className="span-full"><span>패시브 추가 고정속</span><input min="0" onChange={(event) => updateList(setPassiveBonuses, position, event.target.value)} type="number" value={passiveBonuses[position]} /></label>}
                  </div>
                  <footer><span>리더 +{leaderApplied}% · 건물 +{numeric(towerPct)}%</span><strong>{position === 0 ? `기준 최종 ${Math.ceil(positionResult.minimumCombatSpeed)}` : `권장 룬속 +${positionResult.minimumRuneSpeed}`}</strong></footer>
                </article>;
              })}
            </div>
          </section>

          <section className="speed-panel">
            <header className="speed-panel-heading"><div><span>3</span><div><h2>행동 후 게이지 효과</h2><p>지원되는 몬스터는 사용 스킬을 자동으로 불러옵니다. 직접 입력으로 다른 상황도 계산할 수 있습니다.</p></div></div></header>
            <div className="speed-effect-list">
              {teamIds.slice(0, 2).map((id, position) => {
                const monster = getMonster(id);
                const data = speedData.monsters[id];
                const draft = effectDrafts[position];
                const activeSkill = data?.skills.find((skill) => skill.skillSlot === draft.skillSlot);
                const hasDynamicTarget = activeSkill?.effects.some((effect) => !["all_allies", "self"].includes(effect.target));
                return <article key={`${id}-effect-${position}`}>
                  <header><MonsterPortrait compact monster={monster} /><div><span>{position + 1}턴 행동 후</span><strong>{monster.displayName}</strong></div><select aria-label={`${monster.displayName} 효과 방식`} onChange={(event) => updateEffect(position, { ...draft, mode: event.target.value as EffectMode })} value={draft.mode}><option disabled={!data?.skills.length} value="auto">스킬 자동</option><option value="custom">직접 입력</option><option value="none">효과 없음</option></select></header>
                  {draft.mode === "auto" && activeSkill ? <div className="speed-auto-effect"><label><span>사용 스킬</span><select onChange={(event) => updateEffect(position, { ...draft, skillSlot: Number(event.target.value) })} value={draft.skillSlot}>{data.skills.map((skill) => <option key={skill.skillSlot} value={skill.skillSlot}>{skill.skillSlot}스 · {skill.skillName}</option>)}</select></label>{hasDynamicTarget ? <TargetSelect draft={draft} onChange={(target) => updateEffect(position, { ...draft, target })} position={position} teamIds={teamIds} /> : null}<div className="speed-effect-chips">{activeSkill.effects.map((effect, index) => <span className={effect.type === "speed_buff" ? "buff" : "gauge"} key={`${effect.type}-${index}`}>{effect.type === "speed_buff" ? "공속 증가" : `게이지 +${effect.amount}%`} · {effectTargetLabel(effect.target)}</span>)}</div></div> : null}
                  {draft.mode === "custom" ? <div className="speed-custom-effect"><TargetSelect draft={draft} onChange={(target) => updateEffect(position, { ...draft, target })} position={position} teamIds={teamIds} /><label><span>게이지 증가</span><div className="speed-input-suffix"><input max="100" min="0" onChange={(event) => updateEffect(position, { ...draft, gauge: event.target.value })} type="number" value={draft.gauge} /><b>%</b></div></label><label className="speed-check"><input checked={draft.speedBuff} onChange={(event) => updateEffect(position, { ...draft, speedBuff: event.target.checked })} type="checkbox" /><span><strong>공속 증가 버프</strong><small>기본 30% + 아티 효과</small></span></label></div> : null}
                  {draft.mode === "none" ? <p className="speed-no-effect">이 행동 뒤에는 게이지·공속 효과를 적용하지 않습니다.</p> : null}
                </article>;
              })}
            </div>
          </section></> : <section className="speed-awaiting-team"><Icon name="plus" size={22} /><div><strong>몬스터 {teamIds.length - selectedCount}마리를 더 선택해주세요.</strong><p>세 마리가 모두 선택되면 공속 리더와 물호박 패시브를 확인하고 권장 공속을 계산합니다.</p></div></section>}
        </div>

        {result && units ? <aside className="speed-result-panel">
          <header><div><p className="eyebrow">CALCULATION</p><h2>공속 계산 결과</h2></div><span className={allActualEntered ? result.actualSafe ? "safe" : "danger" : "ready"}>{allActualEntered ? result.actualSafe ? "순서 안전" : "순서 재확인" : "권장 컷 계산"}</span></header>
          <div className="speed-result-summary"><div><span>첫 행동 틱</span><strong>{result.firstTurnTick}</strong></div><div><span>선턴 최종속</span><strong>{Math.ceil(result.leadCombatSpeed)}</strong></div><div><span>속도 리더</span><strong>{manualLeaderPct.trim() === "" ? automaticLeaderLabel.amount : numeric(manualLeaderPct)}%</strong></div></div>
          <ol className="speed-result-order">
            {result.positions.map((positionResult, position) => {
              const monster = getMonster(teamIds[position]);
              const entered = positionResult.actualRuneSpeed !== null;
              const meets = entered && positionResult.actualRuneSpeed! >= positionResult.minimumRuneSpeed;
              return <li key={`${teamIds[position]}-result`}><span>{position + 1}</span><MonsterPortrait compact monster={monster} leader={leaderSlot === position} /><div><strong>{monster.displayName}</strong><small>{positionResult.receivesSpeedBuff ? "공속 증가" : "버프 없음"}{positionResult.receivedGaugePct ? ` · 게이지 +${positionResult.receivedGaugePct}%` : ""}</small></div><dl><div><dt>필요 룬속</dt><dd>+{positionResult.minimumRuneSpeed}</dd></div><div><dt>권장 최종</dt><dd>{Math.ceil(positionResult.minimumCombatSpeed)}</dd></div>{entered ? <div className={meets ? "actual-ok" : "actual-low"}><dt>내 입력</dt><dd>+{positionResult.actualRuneSpeed}</dd></div> : null}</dl></li>;
            })}
          </ol>
          {result.actualOrder ? <div className={`speed-order-check ${result.actualSafe ? "safe" : "danger"}`}><Icon name={result.actualSafe ? "check" : "x"} size={18} /><div><strong>입력 공속의 예상 순서</strong><p>{result.actualOrder.map((position) => getMonster(teamIds[position]).displayName).join(" → ")}</p></div></div> : <div className="speed-order-check ready"><Icon name="edit" size={18} /><div><strong>내 공속도 점검할 수 있어요</strong><p>2·3턴 룬 추가 공속을 입력하면 실제 예상 순서를 함께 표시합니다.</p></div></div>}
          <footer><Icon name="sparkles" size={16} /><p>게임 내 게이지 반올림과 특수 패시브에 따라 1~2 정도 차이가 날 수 있습니다. 룬 적용 전 연계 테스트를 권장합니다.</p></footer>
        </aside> : <aside className="speed-result-panel speed-result-empty"><Icon name="bolt" size={24} /><strong>조합 선택 후 계산 결과가 표시됩니다.</strong><p>먼저 왼쪽에서 행동 순서대로 몬스터 세 마리를 골라주세요.</p></aside>}
      </div>

      <MonsterPicker initialSelection={teamIds} maxSelection={3} onClose={() => setEditingSlot(null)} onConfirm={selectTeam} open={editingSlot !== null} replaceSlot={editingSlot} selectionKind="team" />
    </AppShell>
  );
}

function TargetSelect({ draft, onChange, position, teamIds }: { draft: EffectDraft; onChange: (target: string) => void; position: number; teamIds: string[] }) {
  return <label><span>효과 대상</span><select onChange={(event) => onChange(event.target.value)} value={draft.target}><option value="all">뒤의 모든 몬스터</option>{teamIds.slice(position + 1).map((id, index) => <option key={id} value={String(position + index + 1)}>{position + index + 2}턴 · {getMonster(id).displayName}</option>)}</select></label>;
}

function getEffectDraft(data: SpeedMonsterData | undefined, override: EffectDraft | undefined, position: number): EffectDraft {
  if (override) return override;
  return {
    mode: data?.skills.length ? "auto" : "custom",
    skillSlot: data?.skills[0]?.skillSlot ?? 0,
    target: String(position + 1),
    gauge: "0",
    speedBuff: false,
  };
}

function resolveEffects(skills: SpeedSkill[], draft: EffectDraft, actor: number, teamSize: number): AppliedSpeedEffect[] {
  if (draft.mode === "none") return [];
  if (draft.mode === "custom") {
    const targets = draft.target === "all"
      ? Array.from({ length: teamSize - actor - 1 }, (_, index) => actor + index + 1)
      : [Number(draft.target)];
    const effects: AppliedSpeedEffect[] = [];
    if (numeric(draft.gauge) > 0) effects.push({ type: "atb_increase", amount: numeric(draft.gauge), targets });
    if (draft.speedBuff) effects.push({ type: "speed_buff", amount: 0, targets });
    return effects;
  }

  const skill = skills.find((item) => item.skillSlot === draft.skillSlot) ?? skills[0];
  if (!skill) return [];
  return skill.effects.flatMap((effect) => {
    const targets = automaticTargets(effect.target, draft.target, actor, teamSize);
    return targets.length ? [{ type: effect.type, amount: effect.amount, targets }] : [];
  });
}

function automaticTargets(target: string, selectedTarget: string, actor: number, teamSize: number) {
  if (target === "self") return [];
  if (target === "all_allies") return Array.from({ length: teamSize - actor - 1 }, (_, index) => actor + index + 1);
  const fixed = target.match(/^monster(\d+)$/);
  if (fixed) {
    const position = Number(fixed[1]) - 1;
    return position > actor && position < teamSize ? [position] : [];
  }
  const selected = selectedTarget === "all" ? actor + 1 : Number(selectedTarget);
  return selected > actor && selected < teamSize ? [selected] : [];
}

function automaticLeaderForUnit(leader: SpeedLeader, area: "guild" | "arena", leaderElement: string, unitElement: string) {
  if (!leader) return 0;
  const leaderArea = leader.area.toUpperCase();
  if (leaderArea === "GENERAL") return leader.amount;
  if (leaderArea === "GUILD") return area === "guild" ? leader.amount : 0;
  if (leaderArea === "ARENA") return area === "arena" ? leader.amount : 0;
  if (["FIRE", "WATER", "WIND", "LIGHT", "DARK"].includes(leaderArea)) return leaderArea === unitElement ? leader.amount : 0;
  if (leaderArea === "ELEMENT") return leaderElement === unitElement ? leader.amount : 0;
  return 0;
}

function describeLeader(leader: SpeedLeader, area: "guild" | "arena", leaderElement: string) {
  if (!leader) return { amount: 0, label: "선택한 리더의 공속 리더 스킬 없음" };
  const applies = automaticLeaderForUnit(leader, area, leaderElement, leaderElement) > 0;
  if (!applies) return { amount: 0, label: `${leader.area} 전용 · 현재 지역 미적용` };
  return { amount: leader.amount, label: `${area === "guild" ? "점령전" : "아레나"} 자동 +${leader.amount}%` };
}

function effectTargetLabel(target: string) {
  if (target === "all_allies") return "뒤의 아군 전체";
  if (target === "self") return "자신";
  return "지정 아군";
}

function numeric(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function savedStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value) || value.length !== fallback.length || !value.every((item) => typeof item === "string")) return fallback;
  return [...value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
