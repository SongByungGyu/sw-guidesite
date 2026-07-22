"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BuildDetails, BuildSummary, TeamBuildEditor, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";

type Defense = { id: string; title: string; skillOrder: string; author: string; updatedAt: string; recommendationCount: number; monsters: MonsterBuildDraft[] };

export function DefenseManager() {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState("");
  const [selectedDefense, setSelectedDefense] = useState<Defense | null>(null);
  const load = useCallback(() => fetch("/api/defenses", { cache: "no-store" }).then((response) => response.json()).then((result: { member: { role: string }; defenses: Defense[] }) => { setCanManage(result.member.role === "OWNER" || result.member.role === "OFFICER"); setDefenses(result.defenses); }), []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (builds.length !== 3) return setError("방어 몬스터 3마리를 선택해 주세요.");
    const form = new FormData(event.currentTarget);
    setSaving(true); setError("");
    const response = await fetch("/api/defenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), skillOrder: form.get("skillOrder"), builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "방덱을 저장하지 못했습니다.");
    setCreating(false); setBuilds([]); await load();
  }

  return (
    <AppShell activeSection="defenses">
      <div className="page-heading"><div><p className="eyebrow">점령전</p><h1>방덱 관리</h1><p>방어 몬스터 3마리와 실제 룬·핵심 스탯·스킬 지정을 길드 기준으로 정리합니다.</p></div><button className="button primary" type="button" onClick={() => setCreating((value) => !value)}><Icon name={creating ? "x" : "plus"} size={18} /> {creating ? "등록 닫기" : "새 방덱 등록"}</button></div>
      {creating ? <form className="content-create-form" onSubmit={submit}><header><div><span className="step-badge">1</span><div><h2>방덱 구성과 스펙</h2><p>몬스터 선택 후 룬 세트와 중요한 스탯, 사용할 스킬 순서를 입력합니다.</p></div></div></header><div className="simple-fields"><label><span>방덱 이름</span><input name="title" required minLength={2} maxLength={60} placeholder="예: 선턴 압박 방덱" /></label><label><span>스킬 지정</span><input name="skillOrder" maxLength={1000} placeholder="예: 2스 → 3스 → 1스 / 2스 우선" /></label></div><TeamBuildEditor builds={builds} onChange={setBuilds} teamSize={3} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" type="button" onClick={() => setCreating(false)}>취소</button><button className="button primary" disabled={saving} type="submit">{saving ? "저장 중…" : "방덱 저장"}</button></footer></form> : null}
      <section className="content-list-section"><header className="content-list-heading"><div><h2>길드 방덱 목록</h2><p>등록된 방덱 {defenses.length}개 · 카드를 누르면 상세 스펙을 볼 수 있습니다.</p></div></header>{defenses.length ? <div className="defense-card-grid">{defenses.map((defense) => <article aria-haspopup="dialog" className="defense-card" key={defense.id} onClick={() => setSelectedDefense(defense)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDefense(defense); } }} role="button" tabIndex={0}><header><div><h3>{defense.title}</h3><p>{defense.skillOrder || "스킬 지정이 없습니다."}</p></div><span>{defense.recommendationCount} 공덱</span></header><BuildSummary builds={defense.monsters} /><footer><span>작성 {defense.author}</span><span className="defense-card-open"><time>{formatShortDate(defense.updatedAt)}</time><strong>상세 보기</strong><Icon name="chevron" size={15} /></span></footer></article>)}</div> : <div className="request-empty"><Icon name="shield" /><strong>아직 등록된 방덱이 없습니다.</strong><p>첫 방덱을 등록하고 길드원의 스펙 기준을 맞춰보세요.</p></div>}</section>
      {selectedDefense ? <DefenseDetailDialog canManage={canManage} defense={selectedDefense} onChanged={load} onClose={() => setSelectedDefense(null)} /> : null}
    </AppShell>
  );
}

function DefenseDetailDialog({ canManage, defense, onChanged, onClose }: { canManage: boolean; defense: Defense; onChanged: () => Promise<void>; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const defenseQuery = defense.monsters.map((monster) => monster.monsterId).join(",");
  const [editing, setEditing] = useState(false);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>(defense.monsters);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function saveDefense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (builds.length !== 3) return setError("방어 몬스터 3마리를 선택해 주세요.");
    const form = new FormData(event.currentTarget);
    setSaving(true); setError("");
    const response = await fetch(`/api/defenses/${defense.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), skillOrder: form.get("skillOrder"), builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "방덱을 수정하지 못했습니다.");
    await onChanged();
    closeDialog();
  }

  async function deleteDefense() {
    if (!window.confirm(`'${defense.title}' 방덱을 삭제할까요?`)) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/defenses/${defense.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(result.error ?? "방덱을 삭제하지 못했습니다.");
    await onChanged();
    closeDialog();
  }

  return <dialog aria-labelledby="defense-detail-title" className="monster-dialog defense-detail-dialog" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }} onClose={onClose} ref={dialogRef}>
    <div className="defense-detail-shell">
      <header className="dialog-header"><div><p className="eyebrow">길드 방덱 상세</p><h2 id="defense-detail-title">{defense.title}</h2></div><button aria-label="방덱 상세 닫기" className="icon-button" onClick={closeDialog} type="button"><Icon name="x" /></button></header>
      <div className="defense-detail-body">
        <section className="defense-detail-overview" aria-label="방덱 등록 정보"><div><span>작성자</span><strong>{defense.author}</strong></div><div><span>최근 수정</span><strong>{formatDate(defense.updatedAt)}</strong></div><div><span>대응 공덱</span><strong>{defense.recommendationCount}개</strong></div></section>
        <section className="defense-detail-note"><span>스킬 지정</span><p>{defense.skillOrder || "등록된 스킬 지정이 없습니다."}</p></section>
        <section className="defense-detail-builds"><header><div><h3>몬스터 상세 스펙</h3><p>룬 세트와 등록된 체력·공격력·방어력·속도·치확·치피·저항·효적을 확인하세요.</p></div><span>3마리</span></header><BuildDetails builds={defense.monsters} /></section>
        {editing ? <form className="content-create-form compact defense-edit-form" onSubmit={saveDefense}><header><div><span className="step-badge">✎</span><div><h2>방덱 수정</h2><p>몬스터와 스펙, 스킬 지정을 변경합니다.</p></div></div></header><div className="simple-fields"><label><span>방덱 이름</span><input defaultValue={defense.title} name="title" required minLength={2} maxLength={60} /></label><label><span>스킬 지정</span><input defaultValue={defense.skillOrder} name="skillOrder" maxLength={1000} /></label></div><TeamBuildEditor builds={builds} onChange={setBuilds} teamSize={3} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" onClick={() => { setEditing(false); setBuilds(defense.monsters); setError(""); }} type="button">취소</button><button className="button primary" disabled={saving} type="submit">{saving ? "저장 중" : "방덱 수정"}</button></footer></form> : error ? <p className="form-error">{error}</p> : null}
      </div>
      <footer className="dialog-footer">{canManage ? <><button className="button secondary danger" disabled={saving} onClick={() => void deleteDefense()} type="button"><Icon name="trash" size={17} /> 삭제</button><button className="button secondary" disabled={saving} onClick={() => setEditing(true)} type="button"><Icon name="edit" size={17} /> 수정</button></> : null}<button className="button secondary" onClick={closeDialog} type="button">닫기</button><Link className="button primary" href={`/?defense=${encodeURIComponent(defenseQuery)}`}><Icon name="search" size={17} /> 이 방덱 공덱 검색</Link></footer>
    </div>
  </dialog>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}
