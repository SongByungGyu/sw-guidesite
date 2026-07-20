"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { MonsterPortrait } from "@/components/monster-portrait";
import { monsterCatalogMeta, monsters, type Element } from "@/lib/monster-data";

const PAGE_SIZE = 120;
const elements: Array<{ value: "ALL" | Element; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "FIRE", label: "불" },
  { value: "WATER", label: "물" },
  { value: "WIND", label: "바람" },
  { value: "LIGHT", label: "빛" },
  { value: "DARK", label: "어둠" },
];
const grades = ["ALL", 2, 3, 4, 5] as const;

export function MonsterArchive() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [element, setElement] = useState<"ALL" | Element>("ALL");
  const [grade, setGrade] = useState<(typeof grades)[number]>("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => monsters.filter((monster) => {
    const matchesQuery = `${monster.displayName} ${monster.englishName}`
      .toLowerCase()
      .includes(deferredQuery);
    return matchesQuery
      && (element === "ALL" || monster.element === element)
      && (grade === "ALL" || monster.grade === grade);
  }), [deferredQuery, element, grade]);
  const visible = filtered.slice(0, visibleCount);

  function resetPage() {
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <AppShell activeSection="monsters">
      <div className="page-heading monster-page-heading">
        <div>
          <p className="eyebrow">몬스터 마스터</p>
          <h1>몬스터 도감</h1>
          <p>ryhlab 기준 한국어 약칭, 속성, 태생 등급과 실제 몬스터 이미지입니다.</p>
        </div>
        <a className="button secondary" href={monsterCatalogMeta.sourceUrl} rel="noreferrer" target="_blank">
          원본 사이트 <Icon name="chevron" size={17} />
        </a>
      </div>

      <section className="catalog-toolbar" aria-label="몬스터 검색과 필터">
        <label className="search-field catalog-search">
          <Icon name="search" size={18} />
          <span className="sr-only">몬스터 검색</span>
          <input
            onChange={(event) => { setQuery(event.target.value); resetPage(); }}
            placeholder="한국어 약칭 또는 영문 각성명"
            type="search"
            value={query}
          />
        </label>
        <div className="element-filters" aria-label="속성 필터">
          {elements.map((item) => (
            <button
              aria-pressed={element === item.value}
              className={`filter-chip element-filter-${item.value.toLowerCase()}`}
              key={item.value}
              onClick={() => { setElement(item.value); resetPage(); }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grade-filters" aria-label="태생 등급 필터">
          {grades.map((item) => (
            <button
              aria-pressed={grade === item}
              className="filter-chip"
              key={item}
              onClick={() => { setGrade(item); resetPage(); }}
              type="button"
            >
              {item === "ALL" ? "등급 전체" : `태생 ${item}성`}
            </button>
          ))}
        </div>
      </section>

      <div className="catalog-summary" aria-live="polite">
        <strong>{filtered.length.toLocaleString("ko-KR")}마리</strong>
        <span>전체 {monsterCatalogMeta.count.toLocaleString("ko-KR")}마리 · 이미지 로컬 저장</span>
      </div>

      {visible.length ? (
        <section className="catalog-grid" aria-label="몬스터 목록">
          {visible.map((monster) => (
            <article className="catalog-card" key={monster.id}>
              <MonsterPortrait monster={monster} />
              <span className="catalog-english">{monster.englishName}</span>
            </article>
          ))}
        </section>
      ) : (
        <div className="monster-empty catalog-empty">
          <Icon name="search" />
          <strong>조건에 맞는 몬스터가 없습니다.</strong>
          <span>검색어나 필터를 바꿔 주세요.</span>
        </div>
      )}

      {visible.length < filtered.length ? (
        <button
          className="button secondary catalog-more"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          type="button"
        >
          더 보기 ({(filtered.length - visible.length).toLocaleString("ko-KR")}마리 남음)
        </button>
      ) : null}
    </AppShell>
  );
}
