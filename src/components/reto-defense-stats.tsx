"use client";

import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";

type BattleStats = { uses: number; battles: number; wins: number; losses: number };
type RetoMonster = { id: string; name: string; imageUrl: string; element: string; grade: number };
type RetoRow = {
  key: string;
  grade: 4 | 5;
  monsters: [RetoMonster, RetoMonster, RetoMonster];
  totals: BattleStats;
  breakdown: Record<string, BattleStats>;
  rounds: number[];
  servers: string[];
  matchCount: number;
};
export type RetoDataset = {
  dataset: {
    title: string;
    generatedAt: string;
    sourceUrl: string;
    uploadCount: number;
    matchCount: number;
    guildCount: number;
    combinationCount: number;
    defenseDeckCount: number;
    battleLogCount: number;
    matchedBattleLogCount: number;
    rounds: number[];
  };
  rows: RetoRow[];
};

const PAGE_SIZE = 30;
const sampleOptions = [1, 3, 5, 10, 20] as const;
type SortMode = "usage" | "winRate";
type GradeFilter = "all" | 4 | 5;
type ServerFilter = "all" | "kr" | "gb";
type RoundFilter = "all" | number;

function addStats(target: BattleStats, source: BattleStats) {
  target.uses += source.uses;
  target.battles += source.battles;
  target.wins += source.wins;
  target.losses += source.losses;
}

function filteredStats(row: RetoRow, server: ServerFilter, round: RoundFilter) {
  if (server === "all" && round === "all") return row.totals;
  const result: BattleStats = { uses: 0, battles: 0, wins: 0, losses: 0 };
  for (const [key, value] of Object.entries(row.breakdown)) {
    const [segmentServer, segmentRound] = key.split(":");
    if (server !== "all" && segmentServer !== server) continue;
    if (round !== "all" && Number(segmentRound) !== round) continue;
    addStats(result, value);
  }
  return result;
}

function winRate(value: BattleStats) {
  return value.battles ? value.wins / value.battles : -1;
}

export function RetoDefenseStats({ stats }: { stats: RetoDataset }) {
  const [sort, setSort] = useState<SortMode>("usage");
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [server, setServer] = useState<ServerFilter>("all");
  const [round, setRound] = useState<RoundFilter>("all");
  const [minimumBattles, setMinimumBattles] = useState(5);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const rows = useMemo(() => stats.rows
    .filter((row) => grade === "all" || row.grade === grade)
    .map((row) => ({ row, value: filteredStats(row, server, round) }))
    .filter(({ row, value }) => value.uses > 0
      && (!deferredQuery || row.monsters.some((monster) => monster.name.toLowerCase().includes(deferredQuery))))
    .filter(({ value }) => sort !== "winRate" || value.battles >= minimumBattles)
    .sort((left, right) => sort === "usage"
      ? right.value.uses - left.value.uses || right.value.battles - left.value.battles
      : winRate(right.value) - winRate(left.value) || right.value.battles - left.value.battles || right.value.uses - left.value.uses),
  [deferredQuery, grade, minimumBattles, round, server, sort, stats.rows]);

  const totalUses = rows.reduce((sum, item) => sum + item.value.uses, 0);
  const totalBattles = rows.reduce((sum, item) => sum + item.value.battles, 0);
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <AppShell activeSection="reto">
      <div className="page-heading reto-heading">
        <div>
          <p className="eyebrow">SIEGE TOURNAMENT 21</p>
          <h1>레토 21R 방덱 방성 통계</h1>
          <p>한국·글로벌 토너먼트 61경기의 방덱 기용과 방어 성공률을 한 화면에서 비교합니다.</p>
        </div>
        <a className="button secondary" href={stats.dataset.sourceUrl} rel="noreferrer" target="_blank">
          원본 사이트 <Icon name="chevron" size={16} />
        </a>
      </div>

      <section className="reto-kpis" aria-label="데이터 집계 요약">
        <div><span>수집 경기</span><strong>{number(stats.dataset.matchCount)}</strong><small>로그 {number(stats.dataset.uploadCount)}개</small></div>
        <div><span>방덱 배치</span><strong>{number(stats.dataset.defenseDeckCount)}</strong><small>조합 {number(stats.dataset.combinationCount)}개</small></div>
        <div><span>전투 결과</span><strong>{number(stats.dataset.matchedBattleLogCount)}</strong><small>전체 {number(stats.dataset.battleLogCount)}건</small></div>
        <div><span>등장 길드</span><strong>{number(stats.dataset.guildCount)}</strong><small>KR · GLOBAL</small></div>
      </section>

      <section className="reto-toolbar" aria-label="통계 필터">
        <div className="reto-primary-controls">
          <div className="sort-group" role="group" aria-label="정렬 방식">
            <button className={`filter-chip${sort === "usage" ? " active" : ""}`} onClick={() => { setSort("usage"); setVisibleCount(PAGE_SIZE); }} type="button">기용순</button>
            <button className={`filter-chip${sort === "winRate" ? " active" : ""}`} onClick={() => { setSort("winRate"); setVisibleCount(PAGE_SIZE); }} type="button">방어 승률순</button>
          </div>
          <label className="reto-search"><Icon name="search" size={17} /><span className="sr-only">몬스터 검색</span><input onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="몬스터 이름으로 검색" type="search" value={query} /></label>
        </div>
        <div className="reto-filter-row">
          <label><span>방덱 구분</span><select onChange={(event) => { setGrade(event.target.value === "all" ? "all" : Number(event.target.value) as 4 | 5); setVisibleCount(PAGE_SIZE); }} value={grade}><option value="all">전체</option><option value="5">태생 5성 포함</option><option value="4">태생 4성 이하</option></select></label>
          <label><span>서버</span><select onChange={(event) => { setServer(event.target.value as ServerFilter); setVisibleCount(PAGE_SIZE); }} value={server}><option value="all">전체 서버</option><option value="kr">한국</option><option value="gb">글로벌</option></select></label>
          <label><span>라운드</span><select onChange={(event) => { setRound(event.target.value === "all" ? "all" : Number(event.target.value)); setVisibleCount(PAGE_SIZE); }} value={round}><option value="all">전체 라운드</option>{stats.dataset.rounds.map((item) => <option key={item} value={item}>{item}R</option>)}</select></label>
          {sort === "winRate" ? <label><span>최소 전투</span><select onChange={(event) => { setMinimumBattles(Number(event.target.value)); setVisibleCount(PAGE_SIZE); }} value={minimumBattles}>{sampleOptions.map((item) => <option key={item} value={item}>{item}회 이상</option>)}</select></label> : null}
        </div>
      </section>

      <section className="reto-results" aria-labelledby="reto-result-title">
        <header className="reto-result-heading">
          <div><h2 id="reto-result-title">{sort === "usage" ? "가장 많이 기용된 방덱" : "방어 승률이 높은 방덱"}</h2><p>{number(rows.length)}개 조합 · 방덱 {number(totalUses)}회 · 전투 {number(totalBattles)}회</p></div>
          {sort === "winRate" ? <span className="reto-sample-note">표본 {minimumBattles}회 이상만 표시</span> : <span className="reto-sample-note">동일 조합의 배치 횟수 기준</span>}
        </header>

        {visibleRows.length ? <ol className="reto-ranking-list">
          {visibleRows.map(({ row, value }, index) => {
            const rate = value.battles ? value.wins / value.battles * 100 : null;
            const usage = totalUses ? value.uses / totalUses * 100 : 0;
            return <li key={row.key}>
              <span className="reto-rank">{index + 1}</span>
              <div className="reto-team" aria-label={row.monsters.map((monster) => monster.name).join(", ")}>
                {row.monsters.map((monster, monsterIndex) => <RetoPortrait key={`${row.key}-${monster.id}-${monsterIndex}`} leader={monsterIndex === 0} monster={monster} />)}
              </div>
              <div className="reto-team-copy">
                <div><strong>{row.monsters.map((monster) => monster.name).join(" · ")}</strong><span className={`reto-grade grade-${row.grade}`}>{row.grade === 5 ? "태생 5성 포함" : "태생 4성 이하"}</span></div>
                <small>{row.servers.map(serverLabel).join(" · ")} · {row.rounds.map((item) => `${item}R`).join(", ")}</small>
                <div className="reto-usage-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, usage)}%` }} /></div>
              </div>
              <dl className="reto-metrics">
                <div><dt>기용</dt><dd>{number(value.uses)}회 <small>{percent(usage)}</small></dd></div>
                <div><dt>방어 전적</dt><dd>{number(value.wins)}승 {number(value.losses)}패</dd></div>
                <div className="primary"><dt>방어 승률</dt><dd>{rate === null ? "-" : percent(rate)}<small>{number(value.battles)}전</small></dd></div>
              </dl>
            </li>;
          })}
        </ol> : <div className="request-empty"><Icon name="search" /><strong>조건에 맞는 방덱이 없습니다.</strong><p>필터나 최소 전투 표본을 낮춰보세요.</p></div>}

        {visibleCount < rows.length ? <button className="button secondary reto-load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} type="button">다음 {Math.min(PAGE_SIZE, rows.length - visibleCount)}개 더 보기</button> : null}
      </section>

      <footer className="reto-source-note">
        <Icon name="sparkles" size={17} />
        <p><strong>집계 기준</strong> 2026-07-23 공개 Guest 데이터 스냅샷입니다. 업로더·길드원 식별자는 저장하지 않았으며, 승률은 방어 전투 결과와 방덱 ID가 연결된 {number(stats.dataset.matchedBattleLogCount)}건만 사용했습니다.</p>
      </footer>
    </AppShell>
  );
}

function RetoPortrait({ monster, leader }: { monster: RetoMonster; leader: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="reto-portrait">
    <span className={`reto-portrait-image element-${monster.element.toLowerCase()}`}>
      {failed ? <b>{monster.name.slice(-2)}</b> : <Image alt="" height={62} onError={() => setFailed(true)} src={monster.imageUrl} unoptimized width={62} />}
    </span>
    {leader ? <i aria-label="리더"><Icon name="crown" size={11} /></i> : null}
    <small>{monster.name}</small>
    <em>{"★".repeat(monster.grade)}</em>
  </div>;
}

function number(value: number) { return new Intl.NumberFormat("ko-KR").format(value); }
function percent(value: number) { return `${value.toFixed(value >= 10 ? 1 : 2)}%`; }
function serverLabel(value: string) { return value === "kr" ? "한국" : value === "gb" ? "글로벌" : value.toUpperCase(); }
