"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import type { AdminAccessRequest } from "@/lib/access-api";

type AuthState = "loading" | "required" | "authenticated";

export function RequestInbox() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  const loadRequests = useCallback(async () => {
    const response = await fetch("/api/access/requests", { cache: "no-store" });
    if (response.status === 401) {
      setAuthState("required");
      return;
    }
    if (!response.ok) {
      setError("요청 목록을 불러오지 못했습니다.");
      return;
    }
    const result = await response.json() as { requests: AdminAccessRequest[] };
    setRequests(result.requests);
    setAuthState("authenticated");
  }, []);

  useEffect(() => {
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated: boolean }) => {
        if (result.authenticated) return loadRequests();
        setAuthState("required");
      })
      .catch(() => {
        setAuthState("required");
        setError("서버에 연결할 수 없습니다.");
      });
  }, [loadRequests]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: String(form.get("adminKey") ?? "") }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "관리자 확인에 실패했습니다.");
      return;
    }
    await loadRequests();
  }

  async function review(id: string, status: "approved" | "rejected") {
    setProcessingId(id);
    setError("");
    const response = await fetch(`/api/access/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json() as { error?: string };
    setProcessingId("");
    if (!response.ok) {
      setError(result.error ?? "요청을 처리하지 못했습니다.");
      return;
    }
    await loadRequests();
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setRequests([]);
    setAuthState("required");
  }

  if (authState !== "authenticated") {
    return (
      <main className="request-admin-page">
        <div className="access-shell">
          <div className="access-brand">
            <span className="brand-mark"><Icon name="shield" /></span>
            <div><strong>길드 접근 요청함</strong><span>OFFICER · OWNER</span></div>
          </div>
          {authState === "loading" ? (
            <section className="access-card access-loading"><span className="loading-spinner" /><h1>관리자 권한을 확인하고 있습니다.</h1></section>
          ) : (
            <section className="access-card">
              <p className="eyebrow">관리자 확인</p>
              <h1>요청함을 열려면 관리자 키를 입력하세요</h1>
              <p>키는 서버에서 확인되며 브라우저 저장소에 노출되지 않습니다.</p>
              <form className="access-form" onSubmit={signIn}>
                <label><span>관리자 키</span><input name="adminKey" type="password" required autoComplete="current-password" placeholder="관리자에게 받은 키" /></label>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <button className="button primary" type="submit">요청함 열기 <Icon name="chevron" size={18} /></button>
                <Link className="button secondary" href="/">공덱 화면으로</Link>
              </form>
            </section>
          )}
        </div>
      </main>
    );
  }

  const pending = requests.filter((request) => request.status === "pending");
  const reviewed = requests.filter((request) => request.status !== "pending");

  return (
    <main className="request-admin-page">
      <div className="request-admin-shell">
        <header className="request-admin-header">
          <div className="access-brand">
            <span className="brand-mark"><Icon name="shield" /></span>
            <div><strong>길드 접근 요청함</strong><span>OFFICER · OWNER</span></div>
          </div>
          <div className="admin-header-actions">
            <button className="text-button" type="button" onClick={signOut}>관리자 나가기</button>
            <Link className="button secondary" href="/">공덱 화면으로</Link>
          </div>
        </header>

        <section className="admin-overview">
          <div><span>승인 대기</span><strong>{pending.length}</strong></div>
          <div><span>처리 완료</span><strong>{reviewed.length}</strong></div>
          <p><Icon name="sparkles" size={16} /> 모든 승인·반려 기록은 서버 감사 로그에 남습니다.</p>
        </section>

        <section className="request-list-section" aria-labelledby="pending-requests-title">
          <div className="request-list-heading">
            <div><p className="eyebrow">새 요청</p><h1 id="pending-requests-title">승인 대기 요청</h1></div>
            <button className="text-button" type="button" onClick={() => void loadRequests()}>새로고침</button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}

          {pending.length ? (
            <div className="request-list">
              {pending.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="request-avatar">{request.nickname.slice(0, 1)}</div>
                  <div className="request-copy">
                    <div><h2>{request.nickname}</h2><span className="access-status pending"><span /> 승인 대기</span></div>
                    <p>{request.message || "요청 메시지가 없습니다."}</p>
                    <dl className="request-meta">
                      <div><dt>길드 코드</dt><dd>검증 완료</dd></div>
                      <div><dt>요청 시각</dt><dd>{formatDate(request.requestedAt)}</dd></div>
                      <div><dt>요청 번호</dt><dd>{request.id.slice(0, 8).toUpperCase()}</dd></div>
                    </dl>
                  </div>
                  <div className="review-actions">
                    <button className="button secondary danger" type="button" disabled={processingId === request.id} onClick={() => void review(request.id, "rejected")}>
                      <Icon name="x" size={18} /> 반려
                    </button>
                    <button className="button primary approve" type="button" disabled={processingId === request.id} onClick={() => void review(request.id, "approved")}>
                      <Icon name="check" size={18} /> 승인
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="request-empty"><Icon name="users" /><strong>대기 중인 요청이 없습니다.</strong><p>새 요청이 들어오면 이곳에 표시됩니다.</p></div>
          )}
        </section>

        {reviewed.length ? (
          <section className="request-list-section reviewed" aria-labelledby="reviewed-requests-title">
            <h2 id="reviewed-requests-title">최근 처리</h2>
            <div className="reviewed-list">
              {reviewed.map((request) => (
                <div key={request.id}>
                  <strong>{request.nickname}</strong>
                  <span>서버 저장</span>
                  <span className={`access-status ${request.status}`}><span />{request.status === "approved" ? "승인" : "반려"}</span>
                  <time>{formatDate(request.reviewedAt ?? request.requestedAt)}</time>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
