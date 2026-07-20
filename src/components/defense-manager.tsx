"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BuildSummary, TeamBuildEditor, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";

type Defense = { id: string; title: string; note: string; author: string; updatedAt: string; recommendationCount: number; monsters: MonsterBuildDraft[] };

export function DefenseManager() {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => fetch("/api/defenses", { cache: "no-store" }).then((response) => response.json()).then((result: { defenses: Defense[] }) => setDefenses(result.defenses)), []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (builds.length !== 3) return setError("방어 몬스터 3마리를 선택해 주세요.");
    const form = new FormData(event.currentTarget);
    setSaving(true); setError("");
    const response = await fetch("/api/defenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), note: form.get("note"), builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "방덱을 저장하지 못했습니다.");
    setCreating(false); setBuilds([]); await load();
  }

  return (
    <AppShell activeSection="defenses">
      <div className="page-heading"><div><p className="eyebrow">점령전</p><h1>방덱 관리</h1><p>방어 몬스터 3마리와 실제 룬·핵심 스탯을 길드 기준으로 정리합니다.</p></div><button className="button primary" type="button" onClick={() => setCreating((value) => !value)}><Icon name={creating ? "x" : "plus"} size={18} /> {creating ? "등록 닫기" : "새 방덱 등록"}</button></div>
      {creating ? <form className="content-create-form" onSubmit={submit}><header><div><span className="step-badge">1</span><div><h2>방덱 구성과 스펙</h2><p>몬스터 선택 후 룬 세트와 중요한 스탯만 입력해도 됩니다.</p></div></div></header><div className="simple-fields"><label><span>방덱 이름</span><input name="title" required minLength={2} maxLength={60} placeholder="예: 선턴 압박 방덱" /></label><label><span>운영 메모</span><input name="note" maxLength={1000} placeholder="배치 위치·교체 가능 몬스터 등" /></label></div><TeamBuildEditor builds={builds} onChange={setBuilds} teamSize={3} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" type="button" onClick={() => setCreating(false)}>취소</button><button className="button primary" disabled={saving} type="submit">{saving ? "저장 중…" : "방덱 저장"}</button></footer></form> : null}
      <section className="content-list-section"><header className="content-list-heading"><div><h2>길드 방덱 목록</h2><p>등록된 방덱 {defenses.length}개</p></div></header>{defenses.length ? <div className="defense-card-grid">{defenses.map((defense) => <article className="defense-card" key={defense.id}><header><div><h3>{defense.title}</h3><p>{defense.note || "운영 메모가 없습니다."}</p></div><span>{defense.recommendationCount} 공덱</span></header><BuildSummary builds={defense.monsters} /><footer><span>작성 {defense.author}</span><time>{new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(defense.updatedAt))}</time></footer></article>)}</div> : <div className="request-empty"><Icon name="shield" /><strong>아직 등록된 방덱이 없습니다.</strong><p>첫 방덱을 등록하고 길드원의 스펙 기준을 맞춰보세요.</p></div>}</section>
    </AppShell>
  );
}
