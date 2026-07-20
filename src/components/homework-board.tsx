"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BuildDetails, TeamBuildEditor, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";

type Homework = { id: string; title: string; target: string; strategy: string; dueAt?: string; status: string; author: string; completedByMe: boolean; monsters: MonsterBuildDraft[] };

export function HomeworkBoard() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>([]);
  const [error, setError] = useState("");
  const [savingCompletion, setSavingCompletion] = useState<string | null>(null);
  const load = useCallback(() => fetch("/api/homeworks", { cache: "no-store" }).then((response) => response.json()).then((result: { canCreate: boolean; homeworks: Homework[] }) => { setCanCreate(result.canCreate); setHomeworks(result.homeworks); }), []);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (builds.length !== 3) return setError("숙제 공덱 몬스터 3마리를 선택해 주세요.");
    const form = new FormData(event.currentTarget); const due = String(form.get("dueAt") ?? "");
    const response = await fetch("/api/homeworks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), target: form.get("target"), strategy: form.get("strategy"), dueAt: due ? new Date(due).toISOString() : null, builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) return setError(result.error ?? "숙제를 저장하지 못했습니다.");
    setCreating(false); setBuilds([]); setError(""); await load();
  }
  async function toggleComplete(homework: Homework) {
    setSavingCompletion(homework.id);
    setError("");
    const response = await fetch(`/api/homeworks/${homework.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !homework.completedByMe }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? "완료 상태를 변경하지 못했습니다.");
    } else {
      setHomeworks((items) => items.map((item) => item.id === homework.id ? { ...item, completedByMe: !item.completedByMe } : item));
    }
    setSavingCompletion(null);
  }
  return <AppShell activeSection="homeworks"><div className="page-heading"><div><p className="eyebrow">GUILD MISSION</p><h1>길드 숙제</h1><p>운영진이 지정한 공덱과 추천 공격 대상을 한 화면에서 확인합니다.</p></div>{canCreate ? <button className="button primary" onClick={() => setCreating((value) => !value)} type="button"><Icon name={creating ? "x" : "plus"} size={18} /> {creating ? "작성 닫기" : "숙제 작성"}</button> : <span className="permission-badge"><Icon name="shield" size={16} /> 운영진만 작성 가능</span>}</div>
    {creating ? <form className="content-create-form" onSubmit={submit}><header><div><span className="step-badge">+</span><div><h2>새 길드 숙제</h2><p>3마리 공덱과 이 공덱이 유리한 상대 방덱 특징을 함께 적어주세요.</p></div></div></header><div className="simple-fields guide-fields"><label><span>숙제 제목</span><input name="title" required minLength={2} placeholder="예: 공식 공덱 1회 사용" /></label><label><span>마감</span><input name="dueAt" type="datetime-local" /></label><label className="span-full"><span>추천 공격 대상</span><textarea name="target" required minLength={4} placeholder="예: 물 속도 리더 + 면역 없는 방덱을 우선 공격" /></label><label className="span-full"><span>운용 지시</span><textarea name="strategy" required minLength={10} placeholder="공격 순서와 전투 후 해야 할 일을 적어주세요." /></label></div><TeamBuildEditor builds={builds} onChange={setBuilds} teamSize={3} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" type="button" onClick={() => setCreating(false)}>취소</button><button className="button primary" type="submit">숙제 게시</button></footer></form> : null}
    {error && !creating ? <p className="form-error">{error}</p> : null}
    <div className="homework-board-list">{homeworks.map((homework) => <article className={`homework-card${homework.completedByMe ? " is-completed" : ""}`} key={homework.id}><header><div><span className="status-pill">{homework.completedByMe ? "내 숙제 완료" : homework.status === "ACTIVE" ? "진행 중" : "종료"}</span><h2>{homework.title}</h2><p>작성 {homework.author}</p></div><time>{homework.dueAt ? `${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(homework.dueAt))} 마감` : "기한 없음"}</time></header><section className="homework-target"><span><Icon name="search" size={17} /> 추천 공격 대상</span><strong>{homework.target}</strong></section><BuildDetails builds={homework.monsters} /><footer><div><strong>운용 지시</strong><p>{homework.strategy}</p></div><button aria-pressed={homework.completedByMe} className={`button ${homework.completedByMe ? "success" : "secondary"}`} disabled={savingCompletion === homework.id} onClick={() => void toggleComplete(homework)} type="button"><Icon name="check" size={17} /> {savingCompletion === homework.id ? "저장 중" : homework.completedByMe ? "완료 취소" : "완료 표시"}</button></footer></article>)}</div>
  </AppShell>;
}
