import { MonsterPortrait } from "@/components/monster-portrait";
import type { MonsterBuildDraft } from "@/components/team-build-editor";
import { getMonster } from "@/lib/monster-data";

type RequirementKey = "runeSets" | "hp" | "attack" | "defense" | "speed" | "critRate" | "critDamage" | "resistance" | "accuracy" | "artifactLeft" | "artifactRight" | "note";
type RequirementRow = { key: RequirementKey; label: string; kind: "text" | "number" | "percent"; empty: string };

const requirementRows: RequirementRow[] = [
  { key: "runeSets", label: "룬 세트", kind: "text", empty: "미입력" },
  { key: "hp", label: "체력", kind: "number", empty: "상관없음" },
  { key: "attack", label: "공격력", kind: "number", empty: "상관없음" },
  { key: "defense", label: "방어력", kind: "number", empty: "상관없음" },
  { key: "speed", label: "속도", kind: "number", empty: "상관없음" },
  { key: "critRate", label: "치명타 확률", kind: "percent", empty: "상관없음" },
  { key: "critDamage", label: "치명타 피해", kind: "percent", empty: "상관없음" },
  { key: "resistance", label: "효과 저항", kind: "percent", empty: "상관없음" },
  { key: "accuracy", label: "효과 적중", kind: "percent", empty: "상관없음" },
  { key: "artifactLeft", label: "좌측 아티팩트", kind: "text", empty: "선택 없음" },
  { key: "artifactRight", label: "우측 아티팩트", kind: "text", empty: "선택 없음" },
  { key: "note", label: "추가 메모", kind: "text", empty: "—" },
];

export function HomeworkBuildTable({ builds }: { builds: MonsterBuildDraft[] }) {
  return (
    <section className="homework-spec" aria-label="숙제 공덱 몬스터별 최소 스펙">
      <div className="homework-spec-heading">
        <div><strong>공덱 최소 스펙</strong><span>입력되지 않은 수치는 상관없음입니다.</span></div>
        <span>옆으로 밀어 전체 비교</span>
      </div>
      <div className="homework-spec-table-wrap">
        <table className="homework-spec-table">
          <thead>
            <tr>
              <th scope="col">설정 항목</th>
              {builds.map((build) => <MonsterHeader build={build} key={`${build.monsterId}-${build.position}`} />)}
            </tr>
          </thead>
          <tbody>
            {requirementRows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {builds.map((build) => <td className={hasValue(build[row.key]) ? "has-value" : "is-empty"} key={`${build.monsterId}-${row.key}`}>{formatRequirement(build[row.key], row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="homework-spec-mobile">
        {builds.map((build) => {
          const monster = getMonster(build.monsterId);
          return (
            <article key={`${build.monsterId}-${build.position}`}>
              <header><MonsterPortrait compact monster={monster} leader={build.isLeader} /><div><strong>{monster.displayName}</strong><span>{build.isLeader ? "리더 · " : ""}{build.runeSets || "룬 미입력"}</span></div></header>
              <dl>
                {requirementRows.slice(1).map((row) => <div key={row.key}><dt>{row.label}</dt><dd className={hasValue(build[row.key]) ? "has-value" : "is-empty"}>{formatRequirement(build[row.key], row)}</dd></div>)}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MonsterHeader({ build }: { build: MonsterBuildDraft }) {
  const monster = getMonster(build.monsterId);
  return (
    <th scope="col">
      <div className="homework-monster-heading">
        <MonsterPortrait compact monster={monster} leader={build.isLeader} />
        <div><strong>{monster.displayName}</strong><span>{build.isLeader ? "리더" : `${build.position + 1}번`}</span></div>
      </div>
    </th>
  );
}

function hasValue(value: MonsterBuildDraft[RequirementKey]) {
  return value !== null && value !== undefined && value !== "";
}

function formatRequirement(value: MonsterBuildDraft[RequirementKey], row: RequirementRow) {
  if (!hasValue(value)) return row.empty;
  if (typeof value !== "number") return value;
  const formatted = new Intl.NumberFormat("ko-KR").format(value);
  return row.kind === "percent" ? `${formatted}%↑` : `${formatted}↑`;
}
