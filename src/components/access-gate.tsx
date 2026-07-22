"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import type { AccessSessionResponse } from "@/lib/access-api";

const initialSession: AccessSessionResponse = { status: "none" };
type AccessMode = "login" | "request";

export function AccessGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccessSessionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("login");

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

  if (session?.status === "approved" && session.member?.credentialsReady) return children;

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/access/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginId: String(form.get("loginId") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const result = await response.json() as AccessSessionResponse & { error?: string };
    setSubmitting(false);
    if (!response.ok) return setError(result.error ?? "로그인하지 못했습니다.");
    setSession(result);
  }

  async function setupAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("passwordConfirm") ?? "")) {
      setSubmitting(false);
      return setError("비밀번호 확인이 일치하지 않습니다.");
    }
    const response = await fetch("/api/access/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: String(form.get("loginId") ?? ""), password }),
    });
    const result = await response.json() as { error?: string };
    setSubmitting(false);
    if (!response.ok) return setError(result.error ?? "로그인 계정을 설정하지 못했습니다.");
    await refreshSession();
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("passwordConfirm") ?? "")) {
      setSubmitting(false);
      return setError("비밀번호 확인이 일치하지 않습니다.");
    }
    const response = await fetch("/api/access/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: String(form.get("nickname") ?? ""),
        loginId: String(form.get("loginId") ?? ""),
        password,
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
    setAccessMode("request");
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
        ) : session.status === "approved" && !session.member?.credentialsReady ? (
          <section className="access-card" aria-labelledby="account-setup-title">
            <span className="access-status approved"><span /> 승인 완료</span>
            <h1 id="account-setup-title">다른 컴퓨터에서도 사용할 계정을 만들어 주세요</h1>
            <p>{session.member?.nickname}님의 기존 승인 권한에 로그인 아이디와 비밀번호를 연결합니다.</p>
            <form className="access-form" onSubmit={setupAccount}>
              <label><span>로그인 아이디</span><input name="loginId" required minLength={4} maxLength={20} pattern="[A-Za-z0-9._-]+" autoComplete="username" placeholder="영문·숫자 4~20자" /></label>
              <label><span>비밀번호</span><input name="password" type="password" required minLength={8} maxLength={64} autoComplete="new-password" placeholder="영문과 숫자를 포함한 8자 이상" /></label>
              <label><span>비밀번호 확인</span><input name="passwordConfirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력" /></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button primary" type="submit" disabled={submitting}>{submitting ? "계정 만드는 중…" : "계정 만들고 입장"} <Icon name="chevron" size={18} /></button>
            </form>
            <p className="prototype-note"><Icon name="shield" size={15} /> 비밀번호는 복원할 수 없는 암호화 해시로만 저장됩니다.</p>
          </section>
        ) : session.status === "pending" ? (
          <section className="access-card" aria-labelledby="pending-title">
            <span className="access-status pending"><span /> 승인 대기</span>
            <h1 id="pending-title">길드 관리자가 요청을 확인 중입니다.</h1>
            <p>승인되면 이 기기는 자동 입장되고, 다른 컴퓨터에서는 등록한 아이디와 비밀번호로 로그인할 수 있습니다.</p>
            <dl className="request-summary">
              <div><dt>닉네임</dt><dd>{session.request?.nickname}</dd></div>
              <div><dt>신청 상태</dt><dd>관리자 확인 대기</dd></div>
              <div><dt>요청 번호</dt><dd>{session.request?.id.slice(0, 8).toUpperCase()}</dd></div>
            </dl>
            <div className="access-actions">
              <button className="button primary" type="button" onClick={() => void refreshSession()}>
                <Icon name="check" size={18} /> 승인 상태 확인
              </button>
              <button className="button secondary" type="button" onClick={requestAgain}>요청 취소</button>
            </div>
            <p className="prototype-note"><Icon name="sparkles" size={15} /> 요청과 승인은 서버에 안전하게 저장됩니다.</p>
          </section>
        ) : session.status === "rejected" ? (
          <section className="access-card" aria-labelledby="rejected-title">
            <span className="access-status rejected"><span /> 요청 반려</span>
            <h1 id="rejected-title">접근 요청이 반려됐습니다.</h1>
            <p>닉네임과 요청 메시지를 확인한 뒤 다시 신청해 주세요.</p>
            <button className="button primary" type="button" onClick={requestAgain}>다시 요청하기</button>
          </section>
        ) : (
          <section className="access-card" aria-labelledby="access-title">
            <div className="access-mode-tabs" role="tablist" aria-label="접근 방식">
              <button aria-selected={accessMode === "login"} onClick={() => { setAccessMode("login"); setError(""); }} role="tab" type="button">기존 계정 로그인</button>
              <button aria-selected={accessMode === "request"} onClick={() => { setAccessMode("request"); setError(""); }} role="tab" type="button">처음 가입 신청</button>
            </div>
            {accessMode === "login" ? <>
              <p className="eyebrow">MEMBER LOGIN</p>
              <h1 id="access-title">승인된 길드원 로그인</h1>
              <p>다른 컴퓨터에서도 등록한 아이디와 비밀번호로 바로 입장할 수 있습니다.</p>
              <form className="access-form" onSubmit={submitLogin}>
                <label><span>로그인 아이디</span><input name="loginId" required minLength={4} maxLength={20} autoComplete="username" placeholder="가입할 때 등록한 아이디" /></label>
                <label><span>비밀번호</span><input name="password" type="password" required minLength={8} maxLength={64} autoComplete="current-password" placeholder="비밀번호 입력" /></label>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <button className="button primary" type="submit" disabled={submitting}>{submitting ? "로그인 중…" : "바로 입장하기"} <Icon name="chevron" size={18} /></button>
              </form>
            </> : <>
              <p className="eyebrow">FIRST ACCESS</p>
              <h1 id="access-title">길드 접근을 요청하세요</h1>
              <p>최초 한 번만 관리자가 승인하며, 이후에는 등록한 계정으로 바로 입장합니다.</p>
              <form className="access-form" onSubmit={submitRequest}>
                <label><span>게임 닉네임</span><input name="nickname" required minLength={2} maxLength={20} pattern=".*\S.*\S.*" title="공백을 제외하고 두 글자 이상 입력해 주세요." placeholder="예: 서머너별빛" autoComplete="nickname" /></label>
                <label><span>로그인 아이디</span><input name="loginId" required minLength={4} maxLength={20} pattern="[A-Za-z0-9._-]+" autoComplete="username" placeholder="영문·숫자 4~20자" /></label>
                <label><span>비밀번호</span><input name="password" type="password" required minLength={8} maxLength={64} autoComplete="new-password" placeholder="영문과 숫자를 포함한 8자 이상" /></label>
                <label><span>비밀번호 확인</span><input name="passwordConfirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력" /></label>
                <label><span>요청 메시지 <small>선택</small></span><textarea name="message" maxLength={120} placeholder="길드에서 사용하는 이름 등을 적어주세요." /></label>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <button className="button primary" type="submit" disabled={submitting}>{submitting ? "요청 보내는 중…" : "계정 만들고 승인 요청"} <Icon name="chevron" size={18} /></button>
              </form>
            </>}
            <Link className="button secondary" href="/requests"><Icon name="shield" size={18} /> 관리자 입장</Link>
            <p className="access-footnote">비밀번호는 암호화된 해시로 저장되며 원문은 보관하지 않습니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}
