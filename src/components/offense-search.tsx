"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DeckCard } from "@/components/deck-card";
import { Icon } from "@/components/icon";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { searchDecks, type DeckSort } from "@/lib/deck-search";
import { decks as mockDecks, getMonster, type Deck } from "@/lib/mock-data";

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
  const [sort, setSort] = useState<DeckSort>("recommended");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [author, setAuthor] = useState("all");

  const defenseKey = defenseIds.join(",");
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/decks?defense=${encodeURIComponent(defenseKey)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { decks: [] })
      .then((result: { decks: Deck[] }) => {
        if (!cancelled) setSavedDecks(result.decks);
      });
    return () => { cancelled = true; };
  }, [defenseKey]);

  const allDecks = useMemo(() => [...savedDecks, ...mockDecks], [savedDecks]);
  const authors = useMemo(() => Array.from(new Set(allDecks.map((deck) => deck.author))), [allDecks]);
  const defense = defenseIds.map(getMonster);
  const results = searchDecks(allDecks, defenseIds, { sort, officialOnly, author });

  const exact = results.filter((result) => result.match === "exact").map((result) => result.deck);
  const partial = results.filter((result) => result.match === "partial").map((result) => result.deck);
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
    router.push(`/decks/new?defense=${encodeURIComponent(defenseKey)}`);
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
        <div className="defense-team">
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
        </div>
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
        {exact.length ? <div className="deck-list">{exact.map((deck) => <DeckCard deck={deck} key={deck.id} />)}</div> : <EmptyResult filtersActive={filtersActive} onRegister={openRegistration} onReset={resetFilters} />}
      </section>

      <section className="result-section partial" aria-labelledby="partial-title">
        <header className="result-heading">
          <div><span className="status-dot partial" /><div><h2 id="partial-title">2마리 이상 부분 일치</h2><p>정확한 결과가 부족할 때 참고할 수 있는 유사 방어덱입니다.</p></div></div>
          <strong>{partial.length}개</strong>
        </header>
        {partial.length ? <div className="deck-list">{partial.map((deck) => <DeckCard deck={deck} key={deck.id} />)}</div> : <EmptyResult filtersActive={filtersActive} onRegister={openRegistration} onReset={resetFilters} />}
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
    </AppShell>
  );
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
