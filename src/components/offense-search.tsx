"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DeckCard } from "@/components/deck-card";
import { Icon } from "@/components/icon";
import { MonsterPicker } from "@/components/monster-picker";
import { MonsterPortrait } from "@/components/monster-portrait";
import { decks, defaultDefenseIds, getMonster } from "@/lib/mock-data";

type Sort = "recommended" | "rate" | "uses" | "latest";

const sortOptions: Array<{ value: Sort; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rate", label: "승률순" },
  { value: "uses", label: "사용횟수순" },
  { value: "latest", label: "최신순" },
];

export function OffenseSearch() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [defenseIds, setDefenseIds] = useState<string[]>([...defaultDefenseIds]);
  const [sort, setSort] = useState<Sort>("recommended");
  const [officialOnly, setOfficialOnly] = useState(false);

  const defense = defenseIds.map(getMonster);
  const visibleDecks = useMemo(() => {
    const filtered = officialOnly ? decks.filter((deck) => deck.isOfficial) : [...decks];
    return filtered.sort((a, b) => {
      if (sort === "rate") return b.wins / b.battles - a.wins / a.battles;
      if (sort === "uses") return b.battles - a.battles;
      if (sort === "recommended") return Number(b.isOfficial) - Number(a.isOfficial);
      return a.recent.localeCompare(b.recent);
    });
  }, [officialOnly, sort]);

  const exact = visibleDecks.filter((deck) => deck.match === "exact");
  const partial = visibleDecks.filter((deck) => deck.match === "partial");

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">점령전</p>
          <h1>공덱 검색</h1>
          <p>상대 방어덱 3마리를 선택하면 길드가 검증한 공격 조합을 찾아드립니다.</p>
        </div>
        <button className="button secondary desktop-create" type="button">
          <Icon name="plus" size={18} /> 공덱 등록
        </button>
      </div>

      <section className="defense-selector" aria-labelledby="defense-title">
        <div className="section-heading">
          <div>
            <span className="step-badge">1</span>
            <div><h2 id="defense-title">상대 방어덱</h2><p>순서와 관계없이 3마리를 선택합니다.</p></div>
          </div>
          <button className="button primary" onClick={() => setPickerOpen(true)} type="button">
            <Icon name="search" size={18} /> 몬스터 변경
          </button>
        </div>
        <div className="defense-team">
          {defense.map((monster, index) => (
            <MonsterPortrait key={monster.id} monster={monster} selected selectionOrder={index + 1} />
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
        <label className="check-filter">
          <input checked={officialOnly} onChange={(event) => setOfficialOnly(event.target.checked)} type="checkbox" />
          <span>길드 공식만</span>
          <small>P1</small>
        </label>
      </section>

      <section className="result-section" aria-labelledby="exact-title">
        <header className="result-heading">
          <div><span className="status-dot success" /><div><h2 id="exact-title">정확히 일치하는 공덱</h2><p>선택한 방어덱 3마리와 완전히 같은 결과입니다.</p></div></div>
          <strong>{exact.length}개</strong>
        </header>
        {exact.length ? <div className="deck-list">{exact.map((deck) => <DeckCard deck={deck} key={deck.id} />)}</div> : <EmptyResult />}
      </section>

      <section className="result-section partial" aria-labelledby="partial-title">
        <header className="result-heading">
          <div><span className="status-dot partial" /><div><h2 id="partial-title">2마리 이상 부분 일치</h2><p>정확한 결과가 부족할 때 참고할 수 있는 유사 방어덱입니다.</p></div></div>
          <strong>{partial.length}개</strong>
        </header>
        {partial.length ? <div className="deck-list">{partial.map((deck) => <DeckCard deck={deck} key={deck.id} />)}</div> : <EmptyResult />}
      </section>

      <button className="mobile-fab" type="button" aria-label="새 공덱 등록">
        <Icon name="plus" />
      </button>

      <MonsterPicker
        initialSelection={defenseIds}
        onClose={() => setPickerOpen(false)}
        onConfirm={setDefenseIds}
        open={pickerOpen}
      />
    </AppShell>
  );
}

function EmptyResult() {
  return (
    <div className="empty-result">
      <Icon name="search" />
      <div><strong>조건에 맞는 공덱이 없습니다.</strong><p>필터를 해제하거나 첫 공덱을 등록해 보세요.</p></div>
    </div>
  );
}

