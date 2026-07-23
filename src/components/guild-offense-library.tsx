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
import { getMonster } from "@/lib/monster-data";

export function GuildOffenseLibrary() {
  const [selected, setSelected] = useState<GuildOffenseGuide | null>(null);

  return (
    <>
      <header className="guild-offense-library-heading">
        <div>
          <p className="eyebrow">GUILD OFFENSE</p>
          <h1 id="guild-offense-library-title">길드 공덱</h1>
          <p>길드가 정리한 범용 공격 조합입니다. 카드를 누르면 룬·최소 스펙·운영법을 확인할 수 있습니다.</p>
        </div>
        <span>{guildOffenseGuides.length}개 조합</span>
      </header>

      <section className="guild-offense-library" aria-labelledby="guild-offense-library-title">
        <div className="guild-offense-grid">
          {guildOffenseGuides.map((guide) => (
            <button className="guild-offense-card" key={guide.id} onClick={() => setSelected(guide)} type="button">
              <header>
                <div><strong>{guide.title}</strong><span>길드 공식</span></div>
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
          ))}
        </div>
      </section>

      {selected ? <GuildOffenseDetailDialog guide={selected} onClose={() => setSelected(null)} /> : null}
    </>
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
            <p className="eyebrow">길드 공식 공덱</p>
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
