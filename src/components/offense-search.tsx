"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DeckCard } from "@/components/deck-card";
import { GuildOffenseLibrary } from "@/components/guild-offense-library";
import { Icon } from "@/components/icon";
import { MetaDefenseBoard, type MetaDefenseItem } from "@/components/meta-defense-board";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { searchDecks, type DeckSort } from "@/lib/deck-search";
import { getMonster, type Deck } from "@/lib/mock-data";
import { createCombinationKey } from "@/lib/deck-api";

const sortOptions: Array<{ value: DeckSort; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rate", label: "승률순" },
  { value: "uses", label: "사용횟수순" },
  { value: "latest", label: "최신순" },
];

export function OffenseSearch({ initialDefenseIds }: { initialDefenseIds: string[] }) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceSlot, setReplaceSlot] = useState<number | null>(null);
  const [defenseIds, setDefenseIds] = useState<string[]>(initialDefenseIds);
  const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [manageDeck, setManageDeck] = useState<Deck | null>(null);
  const [deckReloadKey, setDeckReloadKey] = useState(0);
  const [sort, setSort] = useState<DeckSort>("recommended");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [author, setAuthor] = useState("all");
  const [metaFiveStar, setMetaFiveStar] = useState<MetaDefenseItem[]>([]);
  const [metaFourStar, setMetaFourStar] = useState<MetaDefenseItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [recordGrade, setRecordGrade] = useState<4 | 5>(5);
  const [recording, setRecording] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");

  const defenseKey = defenseIds.join(",");
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/decks?defense=${encodeURIComponent(defenseKey)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { decks: [] })
      .then((result: { canManage?: boolean; decks: Deck[] }) => {
        if (!cancelled) { setSavedDecks(result.decks); setCanManage(Boolean(result.canManage)); }
      });
    return () => { cancelled = true; };
  }, [defenseKey, deckReloadKey]);

  async function loadMetaDefenses() {
    const response = await fetch("/api/meta-defenses", { cache: "no-store" });
    const result = await response.json().catch(() => ({ fiveStar: [], fourStar: [] }));
    if (response.ok) {
      setMetaFiveStar(result.fiveStar ?? []);
      setMetaFourStar(result.fourStar ?? []);
    }
    setMetaLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/meta-defenses", { cache: "no-store" })
      .then(async (response) => ({ response, result: await response.json().catch(() => ({ fiveStar: [], fourStar: [] })) }))
      .then(({ response, result }) => {
        if (cancelled) return;
        if (response.ok) {
          setMetaFiveStar(result.fiveStar ?? []);
          setMetaFourStar(result.fourStar ?? []);
        }
        setMetaLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const allDecks = useMemo(() => savedDecks, [savedDecks]);
  const authors = useMemo(() => Array.from(new Set(allDecks.map((deck) => deck.author))), [allDecks]);
  const hasSelectedDefense = defenseIds.length === 3;
  const defense = defenseIds.map(getMonster);
  const results = hasSelectedDefense ? searchDecks(allDecks, defenseIds, { sort, officialOnly, author }) : [];

  const exact = results.filter((result) => result.match === "exact").map((result) => result.deck);
  const partial = results.filter((result) => result.match === "partial").map((result) => result.deck);
  const selectedOffenses = (hasSelectedDefense ? searchDecks(allDecks, defenseIds, { sort: "recommended", officialOnly: false, author: "all" }) : [])
    .filter((result) => result.match === "exact")
    .map((result) => result.deck);
  const selectedKey = createCombinationKey(defenseIds);
  const canRecordFourStar = hasSelectedDefense && defense.every((monster) => monster.grade <= 4);
  const filtersActive = officialOnly || author !== "all";

  function resetFilters() {
    setOfficialOnly(false);
    setAuthor("all");
  }

  function openTeamPicker() {
    setReplaceSlot(null);
    setPickerOpen(true);
  }

  function openSlotPicker(index: number) {
    setReplaceSlot(index);
    setPickerOpen(true);
  }

  function closePicker() {
    setPickerOpen(false);
    setReplaceSlot(null);
  }

  function openRegistration() {
    if (!hasSelectedDefense) {
      openTeamPicker();
      return;
    }
    router.push(`/decks/new?defense=${encodeURIComponent(defenseKey)}`);
  }

  function selectMetaDefense(ids: [string, string, string]) {
    setDefenseIds([...ids]);
    setSort("recommended");
    resetFilters();
    setRecordMessage("");
  }

  async function recordCurrentDefense() {
    if (!hasSelectedDefense) return setRecordMessage("먼저 상대 방어덱 몬스터 3마리를 선택해 주세요.");
    if (recordGrade === 4 && !canRecordFourStar) return;
    setRecording(true);
    setRecordMessage("");
    const response = await fetch("/api/meta-defenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ towerGrade: recordGrade, monsterIds: defenseIds }),
    });
    const result = await response.json().catch(() => ({ error: "기록을 저장하지 못했습니다." }));
    setRecordMessage(response.ok ? result.message : result.error ?? "기록을 저장하지 못했습니다.");
    setRecording(false);
    if (response.ok) await loadMetaDefenses();
  }

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">점령전</p>
          <h1>공덱 검색</h1>
          <p>상대 방어덱 3마리를 선택하면 길드가 검증한 공격 조합을 찾아드립니다.</p>
        </div>
        <button className="button secondary desktop-create" onClick={openRegistration} type="button">
          <Icon name="plus" size={18} /> 공덱 등록
        </button>
      </div>

      <GuildOffenseLibrary />

      <MetaDefenseBoard
        canRecordFourStar={canRecordFourStar}
        fiveStar={metaFiveStar}
        fourStar={metaFourStar}
        loading={metaLoading}
        hasSelectedDefense={hasSelectedDefense}
        onGradeChange={setRecordGrade}
        onRecord={recordCurrentDefense}
        onRegisterOffense={openRegistration}
        onSelect={selectMetaDefense}
        recordGrade={recordGrade}
        recording={recording}
        recordMessage={recordMessage}
        selectedDefenseIds={defenseIds}
        selectedKey={selectedKey}
        selectedOffenses={selectedOffenses}
      />

      <section className="defense-selector" aria-labelledby="defense-title">
        <div className="section-heading">
          <div>
            <span className="step-badge">1</span>
            <div><h2 id="defense-title">상대 방어덱</h2><p>순서와 관계없이 3마리를 선택합니다.</p></div>
          </div>
          <button className="button primary" onClick={openTeamPicker} type="button">
            <Icon name="search" size={18} /> 몬스터 변경
          </button>
        </div>
        {hasSelectedDefense ? <div className="defense-team">
          {defense.map((monster, index) => (
            <button
              aria-label={`${index + 1}번 ${monster.displayName} 변경`}
              className="defense-monster-button"
              key={monster.id}
              onClick={() => openSlotPicker(index)}
              type="button"
            >
              <MonsterPortrait monster={monster} selected selectionOrder={index + 1} />
              <span>클릭하여 변경</span>
            </button>
          ))}
        </div> : <button className="empty-team-selector defense-empty-selector" onClick={openTeamPicker} type="button"><span><Icon name="plus" /></span><strong>상대 방어덱 3마리를 선택하세요</strong><small>선택한 뒤 검증된 공덱과 메타 기록을 확인할 수 있습니다.</small></button>}
      </section>

      <section className="result-toolbar" aria-label="검색 결과 정렬과 필터">
        <div className="sort-group" role="group" aria-label="정렬">
          {sortOptions.map((option) => (
            <button
              aria-pressed={sort === option.value}
              className="filter-chip"
              key={option.value}
              onClick={() => setSort(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="result-filters">
          <label className="select-filter">
            <span>작성자</span>
            <select value={author} onChange={(event) => setAuthor(event.target.value)}>
              <option value="all">전체</option>
              {authors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="check-filter">
            <input checked={officialOnly} onChange={(event) => setOfficialOnly(event.target.checked)} type="checkbox" />
            <span>길드 공식만</span>
            <small>P1</small>
          </label>
          {filtersActive ? <button className="text-button" type="button" onClick={resetFilters}>필터 초기화</button> : null}
        </div>
      </section>

      <section className="result-section" aria-labelledby="exact-title">
        <header className="result-heading">
          <div><span className="status-dot success" /><div><h2 id="exact-title">정확히 일치하는 공덱</h2><p>선택한 방어덱 3마리와 완전히 같은 결과입니다.</p></div></div>
          <strong>{exact.length}개</strong>
        </header>
        {exact.length ? <div className="deck-list">{exact.map((deck) => <DeckCard canManage={canManage && Boolean(deck.persisted)} deck={deck} key={deck.id} onManage={setManageDeck} />)}</div> : <EmptyResult filtersActive={filtersActive} onRegister={openRegistration} onReset={resetFilters} />}
      </section>

      <section className="result-section partial" aria-labelledby="partial-title">
        <header className="result-heading">
          <div><span className="status-dot partial" /><div><h2 id="partial-title">2마리 이상 부분 일치</h2><p>정확한 결과가 부족할 때 참고할 수 있는 유사 방어덱입니다.</p></div></div>
          <strong>{partial.length}개</strong>
        </header>
        {partial.length ? <div className="deck-list">{partial.map((deck) => <DeckCard canManage={canManage && Boolean(deck.persisted)} deck={deck} key={deck.id} onManage={setManageDeck} />)}</div> : <EmptyResult filtersActive={filtersActive} onRegister={openRegistration} onReset={resetFilters} />}
      </section>

      <button className="mobile-fab" onClick={openRegistration} type="button" aria-label="새 공덱 등록">
        <Icon name="plus" />
      </button>

      <MonsterPicker
        initialSelection={defenseIds}
        onClose={closePicker}
        onConfirm={setDefenseIds}
        open={pickerOpen}
        replaceSlot={replaceSlot}
      />
      {manageDeck ? <OffenseManageDialog deck={manageDeck} onChanged={() => setDeckReloadKey((value) => value + 1)} onClose={() => setManageDeck(null)} /> : null}
    </AppShell>
  );
}

function OffenseManageDialog({ deck, onChanged, onClose }: { deck: Deck; onChanged: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [defenseIds, setDefenseIds] = useState<string[]>(deck.defenseIds);
  const [offenseIds, setOffenseIds] = useState<string[]>(deck.offenseIds);
  const [leaderSlot, setLeaderSlot] = useState(deck.leaderSlot >= 0 ? deck.leaderSlot : 0);
  const [pickerTarget, setPickerTarget] = useState<"defense" | "offense">("offense");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, []);
  function close() { dialogRef.current?.close(); }
  function openPicker(target: "defense" | "offense") { setPickerTarget(target); setPickerOpen(true); }
  function confirmTeam(ids: string[]) { if (pickerTarget === "defense") setDefenseIds(ids); else { setOffenseIds(ids); if (leaderSlot >= ids.length) setLeaderSlot(0); } }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (defenseIds.length !== 3 || offenseIds.length !== 3) return setError("방덱과 공덱 몬스터를 각각 3마리 선택해 주세요.");
    const form = new FormData(event.currentTarget);
    setSaving(true); setError("");
    const response = await fetch(`/api/decks/${deck.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defenseIds, offenseIds, leaderSlot, title: form.get("title"), strategy: form.get("strategy"), minimumRequirements: form.get("minimumRequirements"), caution: form.get("caution"), status: "published" }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "공덱을 수정하지 못했습니다.");
    onChanged(); close();
  }

  async function remove() {
    if (!window.confirm(`'${deck.title}' 공덱을 삭제할까요?`)) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "공덱을 삭제하지 못했습니다.");
    onChanged(); close();
  }

  return <><dialog aria-labelledby="offense-manage-title" className="monster-dialog defense-detail-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onClose={onClose} ref={dialogRef}><form className="defense-detail-shell" onSubmit={save}><header className="dialog-header"><div><p className="eyebrow">운영진 게시물 관리</p><h2 id="offense-manage-title">공덱 수정</h2></div><button aria-label="공덱 관리 닫기" className="icon-button" onClick={close} type="button"><Icon name="x" /></button></header><div className="defense-detail-body"><div className="simple-fields guide-fields"><label className="span-full"><span>공덱 제목</span><input defaultValue={deck.title} maxLength={60} minLength={2} name="title" required /></label><label className="span-full"><span>운용법</span><textarea defaultValue={deck.strategy ?? deck.summary} maxLength={2000} minLength={10} name="strategy" required /></label><label><span>최소 스펙·조건</span><textarea defaultValue={deck.minimumRequirements} maxLength={1000} name="minimumRequirements" /></label><label><span>주의사항</span><textarea defaultValue={deck.caution} maxLength={1000} name="caution" /></label></div><EditableDeckTeam ids={defenseIds} label="상대 방덱" onEdit={() => openPicker("defense")} /><EditableDeckTeam ids={offenseIds} label="공격덱" leaderSlot={leaderSlot} onEdit={() => openPicker("offense")} /><fieldset className="leader-selector"><legend>공격덱 리더</legend>{offenseIds.map((id, index) => <label className={leaderSlot === index ? "selected" : ""} key={id}><input checked={leaderSlot === index} name="managedLeader" onChange={() => setLeaderSlot(index as 0 | 1 | 2)} type="radio" /><span>{getMonster(id).displayName}</span></label>)}</fieldset>{error ? <p className="form-error">{error}</p> : null}</div><footer className="dialog-footer"><button className="button secondary danger" disabled={saving} onClick={() => void remove()} type="button"><Icon name="trash" size={17} /> 삭제</button><button className="button secondary" onClick={close} type="button">취소</button><button className="button primary" disabled={saving} type="submit"><Icon name="edit" size={17} /> {saving ? "저장 중" : "공덱 수정"}</button></footer></form></dialog><MonsterPicker initialSelection={pickerTarget === "defense" ? defenseIds : offenseIds} onClose={() => setPickerOpen(false)} onConfirm={confirmTeam} open={pickerOpen} selectionKind={pickerTarget} /></>;
}

function EditableDeckTeam({ ids, label, leaderSlot, onEdit }: { ids: string[]; label: string; leaderSlot?: number; onEdit: () => void }) {
  return <section className="managed-deck-team"><header><div><strong>{label}</strong><span>몬스터 3마리</span></div><button className="button secondary" onClick={onEdit} type="button"><Icon name="edit" size={16} /> 변경</button></header><div>{ids.map((id, index) => <MonsterPortrait key={id} leader={leaderSlot === index} monster={getMonster(id)} selected />)}</div></section>;
}

function EmptyResult({ filtersActive, onRegister, onReset }: { filtersActive: boolean; onRegister: () => void; onReset: () => void }) {
  return (
    <div className="empty-result">
      <Icon name="search" />
      <div><strong>조건에 맞는 공덱이 없습니다.</strong><p>필터를 해제하거나 첫 공덱을 등록해 보세요.</p></div>
      {filtersActive ? <button className="button secondary" type="button" onClick={onReset}>필터 초기화</button> : <button className="button secondary" type="button" onClick={onRegister}>첫 공덱 등록</button>}
    </div>
  );
}
