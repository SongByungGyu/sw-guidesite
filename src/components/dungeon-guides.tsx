"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BuildDetails, TeamBuildEditor, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";
import { dungeonCatalog, dungeonCategories, dungeonByKey, type DungeonCategory } from "@/lib/dungeon-catalog";

type Guide = { id: string; dungeonKey: string; title: string; summary: string; strategy: string; difficulty: string; clearTime: string; author: string; updatedAt: string; monsters: MonsterBuildDraft[] };

export function DungeonGuides() {
  const [category, setCategory] = useState<DungeonCategory>("cairos");
  const [selectedKey, setSelectedKey] = useState("cairos-giant");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const selected = dungeonByKey.get(selectedKey) ?? dungeonCatalog[0];
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return dungeonCatalog.filter((item) => item.category === category);
    return dungeonCatalog.filter((item) => `${item.name} ${item.shortName} ${item.description} ${item.reward}`.toLocaleLowerCase("ko-KR").includes(normalized));
  }, [category, query]);
  const load = useCallback(() => fetch(`/api/dungeon-guides?dungeon=${encodeURIComponent(selectedKey)}`, { cache: "no-store" }).then((response) => response.json()).then((result: { canManage: boolean; guides: Guide[] }) => { setCanManage(result.canManage); setGuides(result.guides); }), [selectedKey]);
  useEffect(() => { void load(); }, [load]);

  function closeEditor() { setCreating(false); setEditing(null); setBuilds([]); setError(""); }
  function chooseCategory(next: DungeonCategory) { setCategory(next); const first = dungeonCatalog.find((item) => item.category === next); if (first) setSelectedKey(first.key); closeEditor(); }
  function chooseDungeon(key: string) { const next = dungeonByKey.get(key); if (next) setCategory(next.category); setSelectedKey(key); closeEditor(); }
  function startEdit(guide: Guide) { setEditing(guide); setBuilds(guide.monsters); setCreating(true); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (builds.length !== selected.teamSize) return setError(`${selected.name} 공략은 몬스터 ${selected.teamSize}마리를 선택해 주세요.`);
    const form = new FormData(event.currentTarget);
    const response = await fetch(editing ? `/api/dungeon-guides/${editing.id}` : "/api/dungeon-guides", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dungeonKey: selected.key, title: form.get("title"), summary: form.get("summary"), strategy: form.get("strategy"), difficulty: form.get("difficulty"), clearTime: form.get("clearTime"), builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return setError(result.error ?? "공략을 저장하지 못했습니다.");
    closeEditor(); await load();
  }
  async function deleteGuide(guide: Guide) {
    if (!window.confirm(`'${guide.title}' 던전 공략을 삭제할까요?`)) return;
    const response = await fetch(`/api/dungeon-guides/${guide.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return setError(result.error ?? "공략을 삭제하지 못했습니다.");
    if (editing?.id === guide.id) closeEditor();
    await load();
  }

  return <AppShell activeSection="dungeons">
    <div className="page-heading"><div><p className="eyebrow">PVE ARCHIVE</p><h1>던전 공략</h1><p>카이로스·2차 각성·차원의 홀·이계 레이드까지 길드의 실제 스펙을 모읍니다.</p></div><button className="button primary" onClick={() => creating ? closeEditor() : setCreating(true)} type="button"><Icon name={creating ? "x" : "plus"} size={18} /> {creating ? "작성 닫기" : "공략 등록"}</button></div>
    <label className="dungeon-search"><Icon name="search" size={19} /><span className="sr-only">던전 검색</span><input onChange={(event) => setQuery(event.target.value)} placeholder="던전 이름이나 보상으로 빠르게 찾기" type="search" value={query} />{query ? <button aria-label="검색어 지우기" onClick={() => setQuery("")} type="button"><Icon name="x" size={17} /></button> : null}</label>
    <nav className="dungeon-category-tabs" aria-label="던전 분류">{dungeonCategories.map((item) => <button aria-pressed={!query && category === item.key} key={item.key} onClick={() => { setQuery(""); chooseCategory(item.key); }} type="button"><strong>{item.name}</strong><span>{dungeonCatalog.filter((dungeon) => dungeon.category === item.key).length}</span></button>)}</nav>
    <div className="dungeon-layout"><aside className={`dungeon-list${query ? " is-searching" : ""}`}><header><strong>{query ? "검색 결과" : dungeonCategories.find((item) => item.key === category)?.name}</strong><span>{items.length}개 콘텐츠</span></header>{items.map((item) => <button aria-pressed={selectedKey === item.key} key={item.key} onClick={() => chooseDungeon(item.key)} type="button"><span className="dungeon-icon">{item.shortName.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.reward}</small></span>{item.badge ? <em>{item.badge}</em> : null}<Icon name="chevron" size={17} /></button>)}</aside>
      <section className="dungeon-content"><header className="dungeon-hero"><div><span>{dungeonCategories.find((item) => item.key === selected.category)?.name}</span><h2>{selected.name}</h2><p>{selected.description}</p></div><dl><div><dt>주요 보상</dt><dd>{selected.reward}</dd></div><div><dt>권장 편성</dt><dd>{selected.teamSize}마리</dd></div></dl></header>
        {creating ? <form className="content-create-form compact" key={editing?.id ?? "new-guide"} onSubmit={submit}><header><div><span className="step-badge">{editing ? "✎" : "+"}</span><div><h2>{editing ? `${selected.name} 공략 수정` : `${selected.name} 공략 등록`}</h2><p>실제 클리어 덱과 최소 스펙을 공유하세요.</p></div></div></header><div className="simple-fields guide-fields"><label><span>공략 제목</span><input defaultValue={editing?.title} name="title" required minLength={2} placeholder="예: 평균 50초 안정덱" /></label><label><span>한 줄 요약</span><input defaultValue={editing?.summary} name="summary" required minLength={5} placeholder="누가 사용하면 좋은 덱인지 요약" /></label><label><span>난이도·층</span><input defaultValue={editing?.difficulty} name="difficulty" placeholder="예: 심연 Hard" /></label><label><span>평균 기록</span><input defaultValue={editing?.clearTime} name="clearTime" placeholder="예: 48~55초" /></label><label className="span-full"><span>상세 운용법</span><textarea defaultValue={editing?.strategy} name="strategy" required minLength={10} placeholder="턴 순서, 보스 기믹 대응, 대체 몬스터를 적어주세요." /></label></div><TeamBuildEditor builds={builds} onChange={setBuilds} teamSize={selected.teamSize} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" type="button" onClick={closeEditor}>취소</button><button className="button primary" type="submit">{editing ? "공략 수정" : "공략 저장"}</button></footer></form> : null}
        <div className="guide-list-heading"><div><h2>길드 공략</h2><p>{guides.length ? `${guides.length}개의 검증된 편성` : "아직 등록된 공략이 없습니다."}</p></div></div>{guides.length ? <div className="guide-list">{guides.map((guide) => <article className="guide-card" key={guide.id}><header><div><span className="status-pill">{guide.difficulty || "일반"}</span><h3>{guide.title}</h3><p>{guide.summary}</p></div><div><strong>{guide.clearTime || "기록 없음"}</strong><small>작성 {guide.author}</small>{canManage ? <span className="content-admin-actions labeled"><button onClick={() => startEdit(guide)} type="button"><Icon name="edit" size={15} />수정</button><button onClick={() => void deleteGuide(guide)} type="button"><Icon name="trash" size={15} />삭제</button></span> : null}</div></header><BuildDetails builds={guide.monsters} /><details><summary>상세 운용법 보기</summary><p>{guide.strategy}</p></details></article>)}</div> : <div className="request-empty dungeon-empty"><Icon name="book" /><strong>{selected.name} 첫 공략을 등록해 보세요.</strong><p>몬스터와 스펙을 함께 저장하면 길드원이 바로 따라 할 수 있습니다.</p></div>}</section></div>
  </AppShell>;
}
