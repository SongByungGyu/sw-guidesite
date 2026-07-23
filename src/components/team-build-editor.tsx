"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { MonsterStatPhotoAnalyzer } from "@/components/monster-stat-photo-analyzer";
import { getMonster } from "@/lib/monster-data";
import { monsterStatFields, type MonsterStatValues } from "@/lib/monster-stat-ocr";

export type MonsterBuildDraft = {
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

export function TeamBuildEditor({ builds, onChange, teamSize, allowLeader = true, showArtifacts = false, requireRuneSets = false }: { builds: MonsterBuildDraft[]; onChange: (builds: MonsterBuildDraft[]) => void; teamSize: number; allowLeader?: boolean; showArtifacts?: boolean; requireRuneSets?: boolean }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceSlot, setReplaceSlot] = useState<number | null>(null);
  const [photoSlot, setPhotoSlot] = useState<number | null>(null);

  function selectTeam(ids: string[]) {
    const next = ids.map((monsterId, position) => {
      const existing = builds.find((build) => build.monsterId === monsterId);
      return existing ? { ...existing, position } : createEmptyBuild(monsterId, position);
    });
    if (allowLeader && next.length && !next.some((build) => build.isLeader)) next[0].isLeader = true;
    onChange(next);
  }

  function updateBuild(index: number, key: keyof MonsterBuildDraft, value: string | boolean) {
    onChange(builds.map((build, buildIndex) => {
      if (buildIndex !== index) return key === "isLeader" && value === true ? { ...build, isLeader: false } : build;
      if (key === "isLeader") return { ...build, isLeader: Boolean(value) };
      if (["hp", "attack", "defense", "speed", "critRate", "critDamage", "resistance", "accuracy"].includes(key)) {
        return { ...build, [key]: value === "" ? null : Number(value) };
      }
      return { ...build, [key]: value };
    }));
  }

  function applyPhotoStats(index: number, stats: MonsterStatValues, runeSets: string) {
    onChange(builds.map((build, buildIndex) => {
      if (buildIndex !== index) return build;
      return {
        ...build,
        ...stats,
        runeSets: runeSets || build.runeSets,
      };
    }));
  }

  return (
    <div className="team-build-editor">
      <div className="team-build-toolbar">
        <div><strong>{builds.length}/{teamSize}마리 선택</strong><span>초상화를 누르면 해당 슬롯만 변경할 수 있습니다.</span></div>
        <button className="button secondary" type="button" onClick={() => { setReplaceSlot(null); setPickerOpen(true); }}><Icon name="search" size={17} /> 몬스터 선택</button>
      </div>
      {builds.length ? (
        <div className={`build-editor-grid${teamSize > 3 ? " is-large" : ""}`}>
          {builds.map((build, index) => {
            const monster = getMonster(build.monsterId);
            return (
              <article className="monster-build-card" key={`${build.monsterId}-${index}`}>
                <button className="build-monster-button" type="button" onClick={() => { setReplaceSlot(index); setPickerOpen(true); }}>
                  <MonsterPortrait compact monster={monster} leader={build.isLeader} />
                  <span>몬스터 변경</span>
                </button>
                <div className="build-inputs">
                  {allowLeader ? <label className="leader-check"><input checked={build.isLeader} name="build-leader" onChange={() => updateBuild(index, "isLeader", true)} type="radio" /> 리더</label> : null}
                  <button className="build-photo-analyze" onClick={() => setPhotoSlot(index)} type="button"><Icon name="sparkles" size={15} /> 사진으로 스펙 입력 <span>무료</span></button>
                  <label className="rune-field"><span>룬 세트{requireRuneSets ? " · 필수" : ""}</span><input required={requireRuneSets} value={build.runeSets} onChange={(event) => updateBuild(index, "runeSets", event.target.value)} placeholder="예: 폭주 + 의지" /></label>
                  <div className="compact-stat-grid">
                    {monsterStatFields.map((field) => <label key={field.key}><span>{field.shortLabel}</span><input inputMode="numeric" min="0" type="number" value={build[field.key] ?? ""} onChange={(event) => updateBuild(index, field.key, event.target.value)} placeholder={field.placeholder} /></label>)}
                  </div>
                  {showArtifacts ? <div className="artifact-field-grid">
                    <label><span>좌측 아티팩트</span><input value={build.artifactLeft ?? ""} onChange={(event) => updateBuild(index, "artifactLeft", event.target.value)} placeholder="예: 속도 비례 피해 감소" /></label>
                    <label><span>우측 아티팩트</span><input value={build.artifactRight ?? ""} onChange={(event) => updateBuild(index, "artifactRight", event.target.value)} placeholder="예: 2스킬 회복량" /></label>
                  </div> : null}
                  <label className="build-note"><span>추가 메모</span><input value={build.note} onChange={(event) => updateBuild(index, "note", event.target.value)} placeholder="속도 순서·행동 조건 등" /></label>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <button className="empty-team-selector" type="button" onClick={() => setPickerOpen(true)}><span><Icon name="plus" /></span><strong>사용할 몬스터를 선택하세요</strong><small>선택 후 몬스터별 룬과 핵심 스탯을 입력합니다.</small></button>
      )}
      {photoSlot !== null && builds[photoSlot] ? <MonsterStatPhotoAnalyzer
        build={builds[photoSlot]}
        monsterName={getMonster(builds[photoSlot].monsterId).displayName}
        onApply={(stats, runeSets) => applyPhotoStats(photoSlot, stats, runeSets)}
        onClose={() => setPhotoSlot(null)}
        open
      /> : null}
      <MonsterPicker initialSelection={builds.map((build) => build.monsterId)} maxSelection={teamSize} onClose={() => { setPickerOpen(false); setReplaceSlot(null); }} onConfirm={selectTeam} open={pickerOpen} replaceSlot={replaceSlot} selectionKind="team" />
    </div>
  );
}

export function BuildSummary({ builds }: { builds: MonsterBuildDraft[] }) {
  return (
    <div className="build-summary">
      {builds.map((build) => (
        <div key={`${build.monsterId}-${build.position}`}>
          <MonsterPortrait compact monster={getMonster(build.monsterId)} leader={build.isLeader} />
          <p>{build.runeSets || "룬 정보 없음"}</p>
          <span>{build.speed ? `속 ${build.speed}` : ""}{build.hp ? ` · 체 ${compactNumber(build.hp)}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function BuildDetails({ builds }: { builds: MonsterBuildDraft[] }) {
  return <div className="build-details">{builds.map((build) => <article key={`${build.monsterId}-${build.position}`}><MonsterPortrait compact monster={getMonster(build.monsterId)} leader={build.isLeader} /><div><strong>{getMonster(build.monsterId).displayName}</strong><p>{build.runeSets || "룬 정보 없음"}</p><div className="stat-chip-row">{[["체", build.hp], ["공", build.attack], ["방", build.defense], ["속", build.speed], ["치확", build.critRate], ["치피", build.critDamage], ["저항", build.resistance], ["효적", build.accuracy]].filter((item) => item[1] !== null).map(([label, value]) => <span key={String(label)}>{label} {value}</span>)}</div>{build.note ? <small>{build.note}</small> : null}</div></article>)}</div>;
}

export function createEmptyBuild(monsterId: string, position: number): MonsterBuildDraft {
  return { monsterId, position, isLeader: position === 0, runeSets: "", hp: null, attack: null, defense: null, speed: null, critRate: null, critDamage: null, resistance: null, accuracy: null, artifactLeft: "", artifactRight: "", note: "" };
}

function compactNumber(value: number) {
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
}
