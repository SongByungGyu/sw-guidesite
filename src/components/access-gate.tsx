"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import type { AccessSessionResponse } from "@/lib/access-api";

const initialSession: AccessSessionResponse = { status: "none" };

export function AccessGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccessSessionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/access/session", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setSession(await response.json() as AccessSessionResponse);
    } catch {
      setSession(initialSession);
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshSession(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  useEffect(() => {
    if (session?.status !== "pending") return;
    const timer = window.setInterval(() => void refreshSession(), 3000);
    return () => window.clearInterval(timer);
  }, [refreshSession, session?.status]);

  if (session?.status === "approved") return children;

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/access/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: String(form.get("nickname") ?? ""),
        guildCode: String(form.get("guildCode") ?? ""),
        message: String(form.get("message") ?? ""),
      }),
    });
    const result = await response.json() as AccessSessionResponse & { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setError(result.error ?? "접근 요청을 보내지 못했습니다.");
      return;
    }
    setSession(result);
  }

  async function requestAgain() {
    setError("");
    await fetch("/api/access/requests", { method: "DELETE" });
    setSession(initialSession);
  }

  return (
    <main className="access-page">
      <div className="access-shell">
        <div className="access-brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <div><strong>길드 아카이브</strong><span>승인된 길드원 전용</span></div>
        </div>

        {!session ? (
          <section className="access-card access-loading" aria-live="polite">
            <span className="loading-spinner" />
            <h1>접근 권한을 확인하고 있습니다.</h1>
          </section>
        ) : session.status === "pending" ? (
          <section className="access-card" aria-labelledby="pending-title">
            <span className="access-status pending"><span /> 승인 대기</span>
            <h1 id="pending-title">길드 관리자가 요청을 확인 중입니다.</h1>
            <p>승인되면 이 화면이 자동으로 열립니다. 별도 로그인은 필요하지 않습니다.</p>
            <dl className="request-summary">
              <div><dt>닉네임</dt><dd>{session.request?.nickname}</dd></div>
              <div><dt>길드 코드</dt><dd>확인 완료</dd></div>
              <div><dt>요청 번호</dt><dd>{session.request?.id.slice(0, 8).toUpperCase()}</dd></div>
            </dl>
            <div className="access-actions">
              <Link className="button primary" href="/requests" target="_blank" rel="noreferrer">
                <Icon name="users" size={18} /> 관리자 요청함 열기
              </Link>
              <button className="button secondary" type="button" onClick={requestAgain}>요청 취소</button>
            </div>
            <p className="prototype-note"><Icon name="sparkles" size={15} /> 요청과 승인은 서버에 안전하게 저장됩니다.</p>
          </section>
        ) : session.status === "rejected" ? (
          <section className="access-card" aria-labelledby="rejected-title">
            <span className="access-status rejected"><span /> 요청 반려</span>
            <h1 id="rejected-title">접근 요청이 반려됐습니다.</h1>
            <p>길드 코드와 닉네임을 확인한 뒤 다시 요청해 주세요.</p>
            <button className="button primary" type="button" onClick={requestAgain}>다시 요청하기</button>
          </section>
        ) : (
          <section className="access-card" aria-labelledby="request-title">
            <p className="eyebrow">로그인 없는 접근</p>
            <h1 id="request-title">길드 접근을 요청하세요</h1>
            <p>계정 생성 없이 길드 관리자의 승인을 받은 기기만 이용할 수 있습니다.</p>
            <form className="access-form" onSubmit={submitRequest}>
              <label>
                <span>게임 닉네임</span>
                <input name="nickname" required minLength={2} maxLength={20} pattern=".*\S.*\S.*" title="공백을 제외하고 두 글자 이상 입력해 주세요." placeholder="예: 서머너별빛" autoComplete="nickname" />
              </label>
              <label>
                <span>길드 코드</span>
                <input name="guildCode" required minLength={4} maxLength={20} pattern=".*\S.*\S.*\S.*\S.*" title="공백을 제외하고 네 글자 이상 입력해 주세요." placeholder="관리자에게 받은 코드" autoCapitalize="characters" />
              </label>
              <label>
                <span>요청 메시지 <small>선택</small></span>
                <textarea name="message" maxLength={120} placeholder="길드에서 사용하는 이름 등을 적어주세요." />
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button primary" type="submit" disabled={submitting}>
                {submitting ? "요청 보내는 중…" : "접근 요청 보내기"} <Icon name="chevron" size={18} />
              </button>
            </form>
            <p className="access-footnote">승인된 기기는 90일간 유지되며, 새 기기에서는 다시 요청해야 합니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}
