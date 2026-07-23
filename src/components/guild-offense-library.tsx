"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { MonsterPortrait } from "@/components/monster-portrait";
import { TeamComposition } from "@/components/team-composition";
import {
  guildOffenseGuides,
  guildOffenseStatRows,
  type GuildOffenseGuide,
  type GuildOffenseMonsterGuide,
} from "@/lib/guild-offense-guides";
import {
  createHomeworkOffenseGuide,
  type HomeworkOffense,
} from "@/lib/homework-offense";
import { getMonster } from "@/lib/monster-data";

export function GuildOffenseLibrary() {
  const [selected, setSelected] = useState<GuildOffenseGuide | null>(null);
  const [homeworkGuides, setHomeworkGuides] = useState<GuildOffenseGuide[]>([]);
  const [loadingHomeworks, setLoadingHomeworks] = useState(true);
  const [homeworkError, setHomeworkError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/guild-offenses", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({ homeworks: [], error: "숙제 연동 공덱을 불러오지 못했습니다." })) as { homeworks?: HomeworkOffense[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "숙제 연동 공덱을 불러오지 못했습니다.");
        return result.homeworks ?? [];
      })
      .then((homeworks) => {
        if (!cancelled) setHomeworkGuides(homeworks.map(createHomeworkOffenseGuide));
      })
      .catch((error: Error) => {
        if (!cancelled) setHomeworkError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingHomeworks(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <header className="guild-offense-library-heading">
        <div>
          <p className="eyebrow">GUILD OFFENSE</p>
          <h1 id="guild-offense-library-title">길드 공덱</h1>
          <p>길드가 정리한 범용 공격 조합입니다. 카드를 누르면 룬·최소 스펙·운영법을 확인할 수 있습니다.</p>
        </div>
        <span>{loadingHomeworks ? `${guildOffenseGuides.length}+` : guildOffenseGuides.length + homeworkGuides.length}개 조합</span>
      </header>

      <section className="guild-offense-library" aria-labelledby="guild-offense-library-title">
        <header className="guild-offense-section-heading">
          <div><span>HOMEWORK SYNC</span><h2>숙제 연동 공덱</h2><p>운영진이 숙제를 게시하면 이곳에 자동으로 생성되고, 수정·삭제도 함께 반영됩니다.</p></div>
          <strong>{homeworkGuides.length}개</strong>
        </header>
        {loadingHomeworks ? <div className="guild-offense-sync-state"><span className="loading-spinner" /><p>숙제 공덱을 불러오는 중입니다.</p></div>
          : homeworkError ? <div className="guild-offense-sync-state is-error"><Icon name="x" size={18} /><p>{homeworkError}</p></div>
            : homeworkGuides.length ? <div className="guild-offense-grid">{homeworkGuides.map((guide) => <GuildOffenseCard guide={guide} key={guide.id} onSelect={setSelected} />)}</div>
              : <div className="guild-offense-sync-state"><Icon name="check" size={18} /><p>등록된 숙제가 없습니다. 새 숙제를 게시하면 공덱이 자동으로 추가됩니다.</p></div>}

        <div className="guild-offense-section-divider" />
        <header className="guild-offense-section-heading">
          <div><span>CURATED PRESETS</span><h2>길드 기본 공덱</h2><p>자주 사용하는 범용 조합을 고정해서 모아두었습니다.</p></div>
          <strong>{guildOffenseGuides.length}개</strong>
        </header>
        <div className="guild-offense-grid">
          {guildOffenseGuides.map((guide) => <GuildOffenseCard guide={guide} key={guide.id} onSelect={setSelected} />)}
        </div>
      </section>

      {selected ? <GuildOffenseDetailDialog guide={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function GuildOffenseCard({ guide, onSelect }: { guide: GuildOffenseGuide; onSelect: (guide: GuildOffenseGuide) => void }) {
  return (
    <button className={`guild-offense-card${guide.source === "homework" ? " is-homework" : ""}`} onClick={() => onSelect(guide)} type="button">
      <header>
        <div><strong>{guide.title}</strong><span>{guide.badge ?? "길드 공식"}</span></div>
        <Icon name="chevron" size={17} />
      </header>
      <p>{guide.summary}</p>
      <TeamComposition
        compact
        label={`${guide.title} 길드 공덱`}
        leaderSlot={guide.monsters.findIndex((monster) => monster.isLeader)}
        monsters={guide.monsters.map((monster) => getMonster(monster.monsterId))}
      />
      <small>상세 스펙 및 운영법 보기</small>
    </button>
  );
}

function GuildOffenseDetailDialog({ guide, onClose }: { guide: GuildOffenseGuide; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      aria-labelledby="guild-offense-detail-title"
      className="monster-dialog guild-offense-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="guild-offense-dialog-shell">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">{guide.badge ?? "길드 공식 공덱"}</p>
            <h2 id="guild-offense-detail-title">{guide.title}</h2>
            <p>{guide.summary}</p>
          </div>
          <button aria-label="공덱 상세 닫기" className="icon-button" onClick={close} type="button"><Icon name="x" /></button>
        </header>

        <div className="guild-offense-dialog-body">
          <section className="guild-offense-detail-team" aria-label={`${guide.title} 몬스터 구성`}>
            {guide.monsters.map((build) => (
              <MonsterGuideHeader build={build} key={build.monsterId} />
            ))}
          </section>

          <section className="guild-offense-spec-section">
            <header><div><h3>최소 스펙</h3><p>표시된 수치는 몬스터 기본 능력치를 제외한 추가 수치입니다.</p></div><span>+스펙 기준</span></header>
            <div className="guild-offense-table-wrap">
              <table className="guild-offense-table">
                <thead>
                  <tr>
                    <th scope="col">설정 항목</th>
                    {guide.monsters.map((build) => <th scope="col" key={build.monsterId}>{build.roleName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">룬 세트</th>
                    {guide.monsters.map((build) => <td className="is-key" key={build.monsterId}>{build.runeSets}{build.slotBuild ? <small>{build.slotBuild}</small> : null}</td>)}
                  </tr>
                  {guildOffenseStatRows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      {guide.monsters.map((build) => <td className={build.stats[row.key] === "상관없음" ? "is-empty" : "has-value"} key={build.monsterId}>{build.stats[row.key]}</td>)}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">좌측 아티팩트</th>
                    {guide.monsters.map((build) => <td key={build.monsterId}>{build.artifactLeft}</td>)}
                  </tr>
                  <tr>
                    <th scope="row">우측 아티팩트</th>
                    {guide.monsters.map((build) => <td key={build.monsterId}>{build.artifactRight}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="guild-offense-mobile-builds">
              {guide.monsters.map((build) => <MobileMonsterGuide build={build} key={build.monsterId} />)}
            </div>
          </section>

          <section className="guild-offense-strategy">
            <header><Icon name="sparkles" size={18} /><h3>운영 방법</h3></header>
            <ol>{guide.strategy.map((item) => <li key={item}>{item}</li>)}</ol>
            {guide.note ? <p>{guide.note}</p> : null}
          </section>
        </div>

        <footer className="dialog-footer">
          <button className="button primary" onClick={close} type="button">확인</button>
        </footer>
      </div>
    </dialog>
  );
}

function MonsterGuideHeader({ build }: { build: GuildOffenseMonsterGuide }) {
  return (
    <article>
      <MonsterPortrait compact monster={getMonster(build.monsterId)} leader={build.isLeader} />
      <div>
        <strong>{build.roleName}</strong>
        <span>{build.isLeader ? `리더 · ${build.leaderNote}` : build.runeSets}</span>
      </div>
    </article>
  );
}

function MobileMonsterGuide({ build }: { build: GuildOffenseMonsterGuide }) {
  return (
    <article>
      <header><MonsterGuideHeader build={build} /></header>
      <dl>
        <div className="span-full"><dt>룬 세트</dt><dd>{build.runeSets}{build.slotBuild ? <small>{build.slotBuild}</small> : null}</dd></div>
        {guildOffenseStatRows.map((row) => <div key={row.key}><dt>{row.label}</dt><dd className={build.stats[row.key] === "상관없음" ? "is-empty" : ""}>{build.stats[row.key]}</dd></div>)}
        <div className="span-full"><dt>좌측 아티팩트</dt><dd>{build.artifactLeft}</dd></div>
        <div className="span-full"><dt>우측 아티팩트</dt><dd>{build.artifactRight}</dd></div>
      </dl>
    </article>
  );
}
