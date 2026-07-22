"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

type ChangeRequestItem = {
  id: string;
  category: string;
  content: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  author: string;
  createdAt: string;
  updatedAt: string;
};

export function ChangeRequestWidget({ canManage }: { canManage: boolean }) {
  const [open, setOpen] = useState(false);

  return <>
    <button className="change-request-fab" onClick={() => setOpen(true)} type="button"><Icon name="sparkles" size={18} /><span>수정 요청</span></button>
    {open ? <ChangeRequestDialog canManage={canManage} onClose={() => setOpen(false)} /> : null}
  </>;
}

function ChangeRequestDialog({ canManage, onClose }: { canManage: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [requests, setRequests] = useState<ChangeRequestItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    void fetchChangeRequests().then((items) => {
      setRequests(items);
      setLoading(false);
    }).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "요청 목록을 불러오지 못했습니다.");
      setLoading(false);
    });
  }, []);

  async function refreshRequests() {
    try {
      setRequests(await fetchChangeRequests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "요청 목록을 불러오지 못했습니다.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: form.get("category"), content }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(result.error ?? "수정 요청을 보내지 못했습니다.");
    else {
      setContent("");
      setSuccess("수정 요청이 접수되었습니다.");
      await refreshRequests();
    }
    setSaving(false);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function updateStatus(id: string, status: ChangeRequestItem["status"]) {
    setUpdatingId(id);
    setError("");
    const response = await fetch(`/api/change-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string; updatedAt?: string };
    if (!response.ok) setError(result.error ?? "요청 상태를 변경하지 못했습니다.");
    else setRequests((items) => items.map((item) => item.id === id ? { ...item, status, updatedAt: result.updatedAt ?? item.updatedAt } : item));
    setUpdatingId("");
  }

  return <dialog aria-labelledby="change-request-title" className="monster-dialog change-request-dialog" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }} onClose={onClose} ref={dialogRef}>
    <div className="change-request-shell">
      <header className="dialog-header"><div><p className="eyebrow">GUILD FEEDBACK</p><h2 id="change-request-title">수정 요청 보내기</h2><p>불편한 점이나 추가하고 싶은 기능을 남겨주세요.</p></div><button aria-label="수정 요청 닫기" className="icon-button" onClick={closeDialog} type="button"><Icon name="x" /></button></header>
      <div className="change-request-body">
        <form className="change-request-form" onSubmit={submit}>
          <label><span>요청 종류</span><select defaultValue="기능 요청" name="category"><option>기능 요청</option><option>오류 수정</option><option>내용 수정</option><option>기타</option></select></label>
          <label><span>요청 내용</span><textarea autoFocus maxLength={1000} minLength={5} onChange={(event) => setContent(event.target.value)} placeholder="예: 방덱 상세 화면에서 몬스터별 아티팩트도 보고 싶어요." required value={content} /></label>
          <div className="change-request-form-meta"><span>{content.length}/1000자</span><button className="button primary" disabled={saving || content.trim().length < 5} type="submit"><Icon name="check" size={17} />{saving ? "보내는 중" : "요청 보내기"}</button></div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {success ? <p className="change-request-success" role="status"><Icon name="check" size={16} />{success}</p> : null}
        </form>

        <section className="change-request-history" aria-labelledby="change-request-history-title">
          <header><div><h3 id="change-request-history-title">{canManage ? "길드 전체 요청" : "내가 보낸 요청"}</h3><p>{canManage ? "길드원이 남긴 최근 요청입니다." : "내가 남긴 요청을 확인할 수 있습니다."}</p></div><span>{requests.length}건</span></header>
          {loading ? <div className="change-request-empty"><span className="loading-spinner" /><p>요청을 불러오는 중입니다.</p></div> : requests.length ? <div className="change-request-list">{requests.map((item) => <article key={item.id}><header><span>{item.category}</span>{canManage ? <select aria-label={`${item.author}님의 요청 처리 상태`} className={`change-request-status status-${item.status.toLowerCase()}`} disabled={updatingId === item.id} onChange={(event) => void updateStatus(item.id, event.target.value as ChangeRequestItem["status"])} value={item.status}><option value="PENDING">확인 전</option><option value="IN_PROGRESS">진행 중</option><option value="COMPLETED">완료</option></select> : <em className={`change-request-status status-${item.status.toLowerCase()}`}>{statusLabel(item.status)}</em>}</header><p>{item.content}</p><footer>{canManage ? <strong>{item.author}</strong> : null}<time>{formatRequestDate(item.updatedAt || item.createdAt)}</time></footer></article>)}</div> : <div className="change-request-empty"><Icon name="sparkles" size={20} /><p>아직 등록된 수정 요청이 없습니다.</p></div>}
        </section>
      </div>
    </div>
  </dialog>;
}

async function fetchChangeRequests() {
  const response = await fetch("/api/change-requests", { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as { requests?: ChangeRequestItem[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? "요청 목록을 불러오지 못했습니다.");
  return result.requests ?? [];
}

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function statusLabel(status: ChangeRequestItem["status"]) {
  if (status === "IN_PROGRESS") return "진행 중";
  if (status === "COMPLETED") return "완료";
  return "확인 전";
}
