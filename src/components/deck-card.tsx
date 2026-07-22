import { Icon } from "@/components/icon";
import { TeamComposition } from "@/components/team-composition";
import { getMonster, type Deck } from "@/lib/mock-data";

type DeckCardProps = {
  deck: Deck;
  canManage?: boolean;
  onManage?: (deck: Deck) => void;
};

export function DeckCard({ canManage = false, deck, onManage }: DeckCardProps) {
  const offense = deck.offenseIds.map(getMonster);
  const winRate = deck.battles ? Math.round((deck.wins / deck.battles) * 100) : null;

  return (
    <article className="deck-card">
      <div className="deck-card-heading">
        <div>
          <div className="deck-title-line">
            <h3>{deck.title}</h3>
            {deck.isOfficial ? (
              <span className="official-badge">
                <Icon name="sparkles" size={14} />
                길드 공식 · P1
              </span>
            ) : null}
          </div>
          <p>{deck.summary}</p>
        </div>
        {canManage ? <button className="button secondary content-manage-button" onClick={() => onManage?.(deck)} type="button"><Icon name="edit" size={16} /> 관리</button> : <button className="icon-button" type="button" aria-label={`${deck.title} 상세 보기`}><Icon name="chevron" /></button>}
      </div>

      <div className="deck-body">
        <TeamComposition
          compact
          label={`${deck.title} 공격덱`}
          leaderSlot={deck.leaderSlot}
          monsters={offense}
        />
        <div className={`battle-stat${winRate === null ? " is-new" : ""}`} aria-label={winRate === null ? "아직 전투 기록 없음" : `승률 ${winRate}퍼센트, ${deck.wins}승 ${deck.battles}전`}>
          <strong>{winRate === null ? "신규" : `${winRate}%`}</strong>
          <span>{winRate === null ? "전투 기록 없음" : `${deck.wins}승 / ${deck.battles}전`}</span>
        </div>
      </div>

      <footer className="deck-footer">
        <span>작성자 {deck.author}</span>
        <span>최근 사용 {deck.recent}</span>
      </footer>
    </article>
  );
}
