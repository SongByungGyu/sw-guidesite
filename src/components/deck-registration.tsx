"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { getMonster } from "@/lib/monster-data";

type DeckRegistrationProps = {
  initialDefenseIds: string[];
};

type PickerTarget = "defense" | "offense";

export function DeckRegistration({ initialDefenseIds }: DeckRegistrationProps) {
  const [defenseIds, setDefenseIds] = useState(initialDefenseIds);
  const [offenseIds, setOffenseIds] = useState<string[]>([]);
  const [leaderSlot, setLeaderSlot] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("defense");
  const [replaceSlot, setReplaceSlot] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; status: "draft" | "published" } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  function openPicker(target: PickerTarget, slot: number | null = null) {
    setPickerTarget(target);
    setReplaceSlot(slot);
    setPickerOpen(true);
  }

  function confirmTeam(ids: string[]) {
    if (pickerTarget === "defense") setDefenseIds(ids);
    else {
      setOffenseIds(ids);
      if (leaderSlot >= ids.length) setLeaderSlot(0);
    }
    setDirty(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value === "draft" ? "draft" : "published";
    if (defenseIds.length !== 3 || offenseIds.length !== 3) {
      setError("상대 방어덱과 공격덱을 각각 3마리씩 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defenseIds,
        offenseIds,
        leaderSlot,
        title: String(form.get("title") ?? ""),
        strategy: String(form.get("strategy") ?? ""),
        minimumRequirements: String(form.get("minimumRequirements") ?? ""),
        caution: String(form.get("caution") ?? ""),
        status,
      }),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; status?: "draft" | "published"; error?: string };
    setSubmitting(false);
    if (!response.ok || !result.id || !result.status) {
      setError(result.error ?? "공덱을 저장하지 못했습니다.");
      return;
    }
    setDirty(false);
    setSaved({ id: result.id, status: result.status });
  }

  const defenseQuery = defenseIds.join(",");

  if (saved) {
    return (
      <AppShell>
        <section className="deck-save-success">
          <span className="success-mark"><Icon name="check" size={30} /></span>
          <p className="eyebrow">저장 완료</p>
          <h1>{saved.status === "published" ? "공덱을 길드에 게시했습니다." : "공덱을 임시 저장했습니다."}</h1>
          <p>{saved.status === "published" ? "선택한 방덱의 정확 일치 검색 결과에서 바로 확인할 수 있습니다." : "작성 중인 공덱은 추후 내 작성 목록에서 이어서 편집할 수 있습니다."}</p>
          <div className="deck-save-actions">
            <Link className="button primary" href={`/?defense=${encodeURIComponent(defenseQuery)}`}>검색 결과 확인</Link>
            <Link className="button secondary" href="/decks/new">다른 공덱 등록</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-heading deck-register-heading">
        <div>
          <p className="eyebrow">점령전 · 새 공덱</p>
          <h1>방덱 검색 결과에 공덱 등록</h1>
          <p>상대 방덱을 확인하고 길드원이 그대로 따라 할 수 있는 공격 조합을 남겨주세요.</p>
        </div>
        <Link className="button secondary" href={`/?defense=${encodeURIComponent(defenseQuery)}`}>취소</Link>
      </div>

      <form className="deck-register-form" onChange={() => setDirty(true)} onSubmit={submit}>
        <section className="registration-section">
          <header className="registration-section-heading">
            <span className="step-badge">1</span>
            <div><h2>상대 방어덱 확인</h2><p>공덱이 검색될 기준 방덱입니다. 순서는 검색에 영향을 주지 않습니다.</p></div>
            <button className="button secondary" type="button" onClick={() => openPicker("defense")}><Icon name="search" size={18} /> 방덱 다시 검색</button>
          </header>
          <SelectedTeam ids={defenseIds} label="상대 방어덱" onSlotClick={(slot) => openPicker("defense", slot)} />
        </section>

        <section className="registration-section">
          <header className="registration-section-heading">
            <span className="step-badge">2</span>
            <div><h2>공격덱 3마리 선택</h2><p>실제로 사용할 공격 몬스터와 리더를 지정합니다.</p></div>
            <button className="button primary" type="button" onClick={() => openPicker("offense")}><Icon name="plus" size={18} /> 공격 몬스터 선택</button>
          </header>
          {offenseIds.length === 3 ? (
            <>
              <SelectedTeam ids={offenseIds} label="사용할 공격덱" leaderSlot={leaderSlot} onSlotClick={(slot) => openPicker("offense", slot)} />
              <fieldset className="leader-selector">
                <legend>리더 몬스터</legend>
                {offenseIds.map((id, index) => (
                  <label key={id} className={leaderSlot === index ? "selected" : ""}>
                    <input checked={leaderSlot === index} name="leader" onChange={() => { setLeaderSlot(index); setDirty(true); }} type="radio" />
                    <span>{getMonster(id).displayName}</span>
                  </label>
                ))}
              </fieldset>
            </>
          ) : (
            <button className="empty-team-selector" type="button" onClick={() => openPicker("offense")}>
              <span><Icon name="plus" /></span><strong>공격 몬스터 3마리를 선택하세요</strong><small>몬스터 도감 845마리에서 검색할 수 있습니다.</small>
            </button>
          )}
        </section>

        <section className="registration-section deck-information-section">
          <header className="registration-section-heading">
            <span className="step-badge">3</span>
            <div><h2>공덱 운용 정보</h2><p>핵심 순서와 실패하기 쉬운 조건을 구체적으로 적어주세요.</p></div>
          </header>
          <div className="deck-fields">
            <label className="field-full"><span>공덱 제목 <small>필수</small></span><input name="title" required minLength={2} maxLength={60} placeholder="예: 안정형 선턴 제어 공덱" /></label>
            <label className="field-full"><span>운용법 <small>필수</small></span><textarea name="strategy" required minLength={10} maxLength={2000} placeholder="스킬 사용 순서, 먼저 제거할 대상, 승리 조건을 적어주세요." /></label>
            <label><span>최소 스펙·조건 <small>선택</small></span><textarea name="minimumRequirements" maxLength={1000} placeholder="예: 선턴 몬스터 속도 +210 이상" /></label>
            <label><span>주의사항 <small>선택</small></span><textarea name="caution" maxLength={1000} placeholder="예: 면역이 해제되지 않으면 재도전 권장" /></label>
          </div>
        </section>

        <footer className="registration-actions">
          <div><strong>선택한 방덱에 연결해 저장됩니다.</strong><span>게시 후 검색 결과에서 바로 확인할 수 있습니다.</span></div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Link className="button secondary" href={`/?defense=${encodeURIComponent(defenseQuery)}`}>취소</Link>
          <button className="button secondary" disabled={submitting} formNoValidate name="intent" type="submit" value="draft">임시저장</button>
          <button className="button primary" disabled={submitting} name="intent" type="submit" value="published">{submitting ? "저장 중…" : "공덱 게시"}</button>
        </footer>
      </form>

      <MonsterPicker
        initialSelection={pickerTarget === "defense" ? defenseIds : offenseIds}
        onClose={() => { setPickerOpen(false); setReplaceSlot(null); }}
        onConfirm={confirmTeam}
        open={pickerOpen}
        replaceSlot={replaceSlot}
        selectionKind={pickerTarget}
      />
    </AppShell>
  );
}

function SelectedTeam({ ids, label, leaderSlot, onSlotClick }: { ids: string[]; label: string; leaderSlot?: number; onSlotClick: (slot: number) => void }) {
  return (
    <div className="registration-team" aria-label={label}>
      {ids.map((id, index) => (
        <button key={id} type="button" onClick={() => onSlotClick(index)} aria-label={`${getMonster(id).displayName} 변경`}>
          <MonsterPortrait monster={getMonster(id)} leader={leaderSlot === index} selected />
          <span>클릭하여 변경</span>
        </button>
      ))}
    </div>
  );
}
