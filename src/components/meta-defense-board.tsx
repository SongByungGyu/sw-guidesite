import { Icon } from "@/components/icon";
import { MonsterPortrait } from "@/components/monster-portrait";
import { TeamComposition } from "@/components/team-composition";
import { getMonster, type Deck } from "@/lib/mock-data";

export type MetaDefenseItem = {
  towerGrade: 4 | 5;
  combinationKey: string;
  monsterIds: [string, string, string];
  recordCount: number;
  lastRecordedOn: string;
  offenseCount: number;
  offenseDecks: Deck[];
};

type MetaDefenseBoardProps = {
  fiveStar: MetaDefenseItem[];
  fourStar: MetaDefenseItem[];
  loading: boolean;
  hasSelectedDefense: boolean;
  selectedKey: string;
  selectedDefenseIds: string[];
  selectedOffenses: Deck[];
  recordGrade: 4 | 5;
  recordMessage: string;
  recording: boolean;
  canRecordFourStar: boolean;
  onGradeChange: (grade: 4 | 5) => void;
  onRecord: () => void;
  onRegisterOffense: () => void;
  onSelect: (ids: [string, string, string]) => void;
};

export function MetaDefenseBoard({
  fiveStar,
  fourStar,
  loading,
  hasSelectedDefense,
  selectedKey,
  selectedDefenseIds,
  selectedOffenses,
  recordGrade,
  recordMessage,
  recording,
  canRecordFourStar,
  onGradeChange,
  onRecord,
  onRegisterOffense,
  onSelect,
}: MetaDefenseBoardProps) {
  const selectedMeta = [...fiveStar, ...fourStar].find((item) => item.combinationKey === selectedKey);
  const selectedTeam = selectedDefenseIds.map(getMonster);

  return (
    <section className="meta-defense-board" aria-labelledby="meta-defense-title">
      <header className="meta-defense-heading">
        <div>
          <p className="eyebrow">최근 30일 · 길드 실전 기록</p>
          <h2 id="meta-defense-title">메타 방덱 TOP 5</h2>
          <p>자주 만난 방덱을 누르면 검증된 공덱을 한 번에 확인할 수 있습니다.</p>
        </div>
        <div className="meta-record-controls">
          <div className="meta-grade-toggle" role="group" aria-label="기록할 거점 등급">
            {[5, 4].map((grade) => (
              <button
                aria-pressed={recordGrade === grade}
                key={grade}
                onClick={() => onGradeChange(grade as 4 | 5)}
                type="button"
              >
                {grade}성 거점
              </button>
            ))}
          </div>
          <button
            className="button primary"
            disabled={!hasSelectedDefense || recording || (recordGrade === 4 && !canRecordFourStar)}
            onClick={onRecord}
            type="button"
          >
            <Icon name="plus" size={17} /> {recording ? "기록 중..." : "현재 방덱 기록"}
          </button>
        </div>
      </header>

      {!hasSelectedDefense ? (
        <p className="meta-record-message">메타 방덱을 선택하거나 아래에서 몬스터 3마리를 선택해 주세요.</p>
      ) : recordGrade === 4 && !canRecordFourStar ? (
        <p className="meta-record-message is-error">4성 거점에는 태생 5성 몬스터가 포함될 수 없습니다.</p>
      ) : recordMessage ? <p className="meta-record-message" aria-live="polite">{recordMessage}</p> : null}

      <div className="meta-ranking-grid">
        <MetaRanking title="5성 방덱 TOP 5" items={fiveStar} loading={loading} selectedKey={selectedKey} onSelect={onSelect} />
        <MetaRanking title="4성 방덱 TOP 5" items={fourStar} loading={loading} selectedKey={selectedKey} onSelect={onSelect} />
      </div>

      <div className="meta-offense-panel">
        <div className="meta-selected-defense">
          <div>
            <span className="meta-panel-label">선택한 방덱</span>
            <strong>{hasSelectedDefense ? selectedTeam.map((monster) => monster.displayName).join(" · ") : "선택된 방덱 없음"}</strong>
            <span>{hasSelectedDefense ? selectedMeta ? `최근 30일 ${selectedMeta.recordCount}회 기록` : "TOP 5 밖의 직접 선택 방덱" : "메타 목록이나 몬스터 선택에서 방덱을 골라주세요."}</span>
          </div>
          <div className="meta-selected-portraits" aria-label={selectedTeam.map((monster) => monster.displayName).join(", ")}>
            {selectedTeam.map((monster) => <MonsterPortrait compact key={monster.id} monster={monster} />)}
          </div>
        </div>

        <div className="meta-offense-heading">
          <div><h3>이 방덱의 대응 공덱</h3><p>정확히 일치하는 검증 조합을 우선 표시합니다.</p></div>
          <strong>{selectedOffenses.length}개</strong>
        </div>
        {selectedOffenses.length ? (
          <div className="meta-offense-grid">
            {selectedOffenses.slice(0, 3).map((deck) => (
              <article className="meta-offense-card" key={deck.id}>
                <div className="meta-offense-title">
                  <div><h4>{deck.title}</h4><span>작성자 {deck.author}</span></div>
                  {deck.isOfficial ? <span className="official-badge"><Icon name="sparkles" size={13} /> 공식</span> : null}
                </div>
                <TeamComposition compact label={`${deck.title} 공격덱`} leaderSlot={deck.leaderSlot} monsters={deck.offenseIds.map(getMonster)} />
                <p>{deck.summary}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="meta-offense-empty">
            <div><strong>아직 등록된 대응 공덱이 없습니다.</strong><p>이 방덱의 첫 공략 조합을 길드에 남겨 주세요.</p></div>
            <button className="button secondary" onClick={onRegisterOffense} type="button">공덱 등록</button>
          </div>
        )}
      </div>
    </section>
  );
}

function MetaRanking({ title, items, loading, selectedKey, onSelect }: {
  title: string;
  items: MetaDefenseItem[];
  loading: boolean;
  selectedKey: string;
  onSelect: (ids: [string, string, string]) => void;
}) {
  return (
    <section className="meta-ranking-column" aria-label={title}>
      <header><h3>{title}</h3><span>방덱 · 기록 · 공덱</span></header>
      {loading ? (
        <div className="meta-ranking-empty">순위를 불러오는 중입니다.</div>
      ) : items.length ? (
        <ol className="meta-ranking-list">
          {items.map((item, index) => {
            const monsters = item.monsterIds.map(getMonster);
            const selected = item.combinationKey === selectedKey;
            return (
              <li key={`${item.towerGrade}-${item.combinationKey}`}>
                <button
                  aria-label={`${index + 1}위 ${monsters.map((monster) => monster.displayName).join(", ")} 선택`}
                  aria-pressed={selected}
                  className="meta-defense-row"
                  onClick={() => onSelect(item.monsterIds)}
                  type="button"
                >
                  <span className="meta-rank">{index + 1}</span>
                  <span className="meta-row-portraits">
                    {monsters.map((monster) => <MonsterPortrait compact key={monster.id} monster={monster} />)}
                  </span>
                  <span className="meta-row-copy">
                    <strong>{monsters.map((monster) => monster.displayName).join(" · ")}</strong>
                    <small>{item.recordCount}회 기록</small>
                  </span>
                  <span className={`meta-offense-count${item.offenseCount ? " has-offense" : ""}`}>공덱 {item.offenseCount}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="meta-ranking-empty">아직 실전 기록이 없습니다.<br />현재 방덱을 첫 기록으로 남겨 주세요.</div>
      )}
    </section>
  );
}
