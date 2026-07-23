"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HomeworkBuildTable } from "@/components/homework-build-table";
import { TeamBuildEditor, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";
import { KakaoShareButton } from "@/components/kakao-share-button";
import { createSharedContentPath, readSharedHomeworkId } from "@/lib/share-links";

type ProgressMember = { id: string; nickname: string; role: "OWNER" | "OFFICER" | "MEMBER"; completedAt?: string };
type HomeworkProgress = { completed: ProgressMember[]; incomplete: ProgressMember[]; total: number };
type Homework = { id: string; title: string; target: string; strategy: string; dueAt?: string; status: string; author: string; completedByMe: boolean; monsters: MonsterBuildDraft[]; progress?: HomeworkProgress };

export function HomeworkBoard() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [builds, setBuilds] = useState<MonsterBuildDraft[]>([]);
  const [error, setError] = useState("");
  const [savingCompletion, setSavingCompletion] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharedHomeworkId, setSharedHomeworkId] = useState<string | null>(null);
  const load = useCallback(() => fetch("/api/homeworks", { cache: "no-store" }).then((response) => response.json()).then((result: { canCreate: boolean; homeworks: Homework[] }) => { setCanCreate(result.canCreate); setHomeworks(result.homeworks); }), []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!homeworks.length) return;
    const id = readSharedHomeworkId(window.location.search);
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      if (!homeworks.some((homework) => homework.id === id)) {
        setError("공유된 숙제를 찾을 수 없습니다. 삭제되었거나 종료된 숙제일 수 있습니다.");
        return;
      }
      setSharedHomeworkId(id);
      const target = document.getElementById(`homework-${id}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [homeworks]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (builds.length !== 3) return setError("숙제 공덱 몬스터 3마리를 선택해 주세요.");
    if (builds.some((build) => !build.runeSets.trim())) return setError("세 몬스터의 룬 세트를 모두 입력해 주세요.");
    if (builds.some((build) => [build.hp, build.attack, build.defense, build.speed, build.critRate, build.critDamage, build.resistance, build.accuracy].every((value) => value === null))) return setError("각 몬스터에 필요한 최소 스탯을 하나 이상 입력해 주세요.");
    const form = new FormData(event.currentTarget); const due = String(form.get("dueAt") ?? "");
    const response = await fetch(editing ? `/api/homeworks/${editing.id}` : "/api/homeworks", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), target: form.get("target"), strategy: form.get("strategy"), dueAt: due ? new Date(due).toISOString() : null, builds }) });
    const result = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) return setError(result.error ?? "숙제를 저장하지 못했습니다.");
    setCreating(false); setEditing(null); setBuilds([]); setError(""); await load();
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
      await load();
    }
    setSavingCompletion(null);
  }
  async function deleteHomework(homework: Homework) {
    if (!window.confirm(`'${homework.title}' 숙제를 종료하고 목록에서 삭제할까요? 길드 공덱에 생성된 보관본은 계속 유지됩니다.`)) return;
    setDeletingId(homework.id);
    setError("");
    const response = await fetch(`/api/homeworks/${homework.id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? "숙제를 삭제하지 못했습니다.");
    } else {
      setHomeworks((items) => items.filter((item) => item.id !== homework.id));
    }
    setDeletingId(null);
  }
  function startEdit(homework: Homework) { setEditing(homework); setBuilds(homework.monsters); setCreating(true); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function closeEditor() { setCreating(false); setEditing(null); setBuilds([]); setError(""); }
  return <AppShell activeSection="homeworks"><div className="page-heading"><div><p className="eyebrow">GUILD MISSION</p><h1>길드 숙제</h1><p>운영진이 지정한 공덱과 추천 공격 대상을 한 화면에서 확인합니다.</p></div>{canCreate ? <button className="button primary" onClick={() => creating ? closeEditor() : setCreating(true)} type="button"><Icon name={creating ? "x" : "plus"} size={18} /> {creating ? "작성 닫기" : "숙제 작성"}</button> : <span className="permission-badge"><Icon name="shield" size={16} /> 운영진만 작성 가능</span>}</div>
    {creating ? <form className="content-create-form" key={editing?.id ?? "new-homework"} onSubmit={submit}><header><div><span className="step-badge">{editing ? "✎" : "+"}</span><div><h2>{editing ? "길드 숙제 수정" : "새 길드 숙제"}</h2><p>3마리 공덱과 이 공덱이 유리한 상대 방덱 특징을 함께 적어주세요.</p></div></div></header><div className="simple-fields guide-fields"><label><span>숙제 제목</span><input defaultValue={editing?.title} name="title" required minLength={2} placeholder="예: 공식 공덱 1회 사용" /></label><label><span>마감</span><input defaultValue={editing?.dueAt ? toDateTimeLocal(editing.dueAt) : undefined} name="dueAt" type="datetime-local" /></label><label className="span-full"><span>추천 공격 대상</span><textarea defaultValue={editing?.target} name="target" required minLength={4} placeholder="예: 물 속도 리더 + 면역 없는 방덱을 우선 공격" /></label><label className="span-full"><span>운용 지시</span><textarea defaultValue={editing?.strategy} name="strategy" required minLength={10} placeholder="공격 순서와 전투 후 해야 할 일을 적어주세요." /></label></div><div className="homework-build-guide"><Icon name="sparkles" size={17} /><div><strong>몬스터별 최소 스펙 입력</strong><p>룬 세트는 필수입니다. 체력·공격력·방어력·속도·치확·치피·저항·적중은 몬스터마다 필요한 기준을 1개 이상 입력하세요. 나머지 빈칸은 상관없음으로 표시됩니다.</p></div></div><TeamBuildEditor builds={builds} onChange={setBuilds} requireRuneSets showArtifacts teamSize={3} />{error ? <p className="form-error">{error}</p> : null}<footer><button className="button secondary" type="button" onClick={closeEditor}>취소</button><button className="button primary" type="submit">{editing ? "숙제 수정" : "숙제 게시"}</button></footer></form> : null}
    {error && !creating ? <p className="form-error">{error}</p> : null}
    <div className="homework-board-list">{homeworks.map((homework) => <article className={`homework-card${homework.completedByMe ? " is-completed" : ""}${sharedHomeworkId === homework.id ? " is-shared-target" : ""}`} id={`homework-${homework.id}`} key={homework.id} tabIndex={-1}><header><div><span className="status-pill">{homework.completedByMe ? "내 숙제 완료" : homework.status === "ACTIVE" ? "진행 중" : "종료"}</span><h2>{homework.title}</h2><p>작성 {homework.author}</p></div><time>{homework.dueAt ? `${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(homework.dueAt))} 마감` : "기한 없음"}</time></header><section className="homework-target"><span><Icon name="search" size={17} /> 추천 공격 대상</span><strong>{homework.target}</strong></section><HomeworkBuildTable builds={homework.monsters} />{homework.progress ? <HomeworkProgressPanel progress={homework.progress} /> : null}<footer><div><strong>운용 지시</strong><p>{homework.strategy}</p></div><div className="homework-footer-actions"><KakaoShareButton category="길드 숙제" description={`${homework.target} · ${homework.dueAt ? `${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(homework.dueAt))} 마감` : "기한 없음"}`} path={createSharedContentPath("homework", homework.id)} title={homework.title} />{canCreate ? <><button className="button secondary" disabled={deletingId === homework.id} onClick={() => startEdit(homework)} type="button"><Icon name="edit" size={17} /> 숙제 수정</button><button className="button secondary danger" disabled={deletingId === homework.id} onClick={() => void deleteHomework(homework)} type="button"><Icon name="trash" size={17} /> {deletingId === homework.id ? "삭제 중" : "숙제 삭제"}</button></> : null}<button aria-pressed={homework.completedByMe} className={`button ${homework.completedByMe ? "success" : "secondary"}`} disabled={savingCompletion === homework.id || deletingId === homework.id} onClick={() => void toggleComplete(homework)} type="button"><Icon name="check" size={17} /> {savingCompletion === homework.id ? "저장 중" : homework.completedByMe ? "완료 취소" : "완료 표시"}</button></div></footer></article>)}</div>
  </AppShell>;
}

function HomeworkProgressPanel({ progress }: { progress: HomeworkProgress }) {
  const completionRate = progress.total ? Math.round((progress.completed.length / progress.total) * 100) : 0;
  return <details className="homework-progress" open>
    <summary>
      <span className="homework-progress-summary-copy"><span><Icon name="users" size={17} /><strong>숙제 참여 현황</strong><em>운영진 확인</em></span><small>완료한 길드원과 아직 진행하지 않은 길드원을 구분합니다.</small></span>
      <span className="homework-progress-count"><span className="homework-progress-split"><b>{progress.completed.length}명 완료</b><b>{progress.incomplete.length}명 미진행</b></span><span>{completionRate}%</span><Icon name="chevron" size={17} /></span>
    </summary>
    <div className="homework-progress-body">
      <div aria-label={`숙제 완료율 ${completionRate}%`} className="homework-progress-bar" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={completionRate}><span style={{ width: `${completionRate}%` }} /></div>
      <div className="homework-status-columns">
        <HomeworkMemberGroup members={progress.completed} status="complete" />
        <HomeworkMemberGroup members={progress.incomplete} status="incomplete" />
      </div>
    </div>
  </details>;
}

function HomeworkMemberGroup({ members, status }: { members: ProgressMember[]; status: "complete" | "incomplete" }) {
  const complete = status === "complete";
  return <section className="homework-status-group">
    <header><span className="homework-status-title"><i className={`status-dot-${status}`} /><strong>{complete ? "진행 완료" : "미진행"}</strong></span><b>{members.length}명</b></header>
    {members.length ? <ul className="homework-member-list">{members.map((member) => <li key={member.id}><span className="homework-member-identity"><strong>{member.nickname}</strong><em>{roleLabel(member.role)}</em></span><span className={complete ? "member-completion-time" : "member-incomplete-label"}>{complete && member.completedAt ? formatCompletionTime(member.completedAt) : "아직 미완료"}</span></li>)}</ul> : <p className="homework-member-empty">해당 길드원이 없습니다.</p>}
  </section>;
}

function roleLabel(role: ProgressMember["role"]) {
  return role === "OWNER" ? "길드장" : role === "OFFICER" ? "운영진" : "길드원";
}

function formatCompletionTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
