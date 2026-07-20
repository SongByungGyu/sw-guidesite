"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { createAccessRequest } from "@/lib/access-request";
import {
  clearAccessSession,
  saveAccessRequests,
  setAccessSession,
  useAccessRequests,
  useAccessSessionId,
} from "@/lib/access-request-store";

export function AccessGate({ children }: { children: ReactNode }) {
  const requests = useAccessRequests();
  const sessionId = useAccessSessionId();
  const currentRequest = requests.find((request) => request.id === sessionId);

  if (currentRequest?.status === "approved") return children;

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const request = createAccessRequest(
      {
        nickname: String(form.get("nickname") ?? ""),
        guildCode: String(form.get("guildCode") ?? ""),
        message: String(form.get("message") ?? ""),
      },
      { id: crypto.randomUUID(), now: new Date().toISOString() },
    );
    saveAccessRequests([request, ...requests]);
    setAccessSession(request.id);
  }

  function requestAgain() {
    clearAccessSession();
  }

  return (
    <main className="access-page">
      <div className="access-shell">
        <div className="access-brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <div><strong>길드 아카이브</strong><span>승인된 길드원 전용</span></div>
        </div>

        {currentRequest?.status === "pending" ? (
          <section className="access-card" aria-labelledby="pending-title">
            <span className="access-status pending"><span /> 승인 대기</span>
            <h1 id="pending-title">길드 관리자가 요청을 확인 중입니다.</h1>
            <p>승인되면 이 브라우저에서 별도 로그인 없이 바로 이용할 수 있습니다.</p>
            <dl className="request-summary">
              <div><dt>닉네임</dt><dd>{currentRequest.nickname}</dd></div>
              <div><dt>길드 코드</dt><dd>{currentRequest.guildCode}</dd></div>
              <div><dt>요청 번호</dt><dd>{currentRequest.id.slice(0, 8).toUpperCase()}</dd></div>
            </dl>
            <div className="access-actions">
              <Link className="button primary" href="/requests" target="_blank" rel="noreferrer">
                <Icon name="users" size={18} /> 관리자 요청함 열기
              </Link>
              <button className="button secondary" type="button" onClick={requestAgain}>요청 취소</button>
            </div>
            <p className="prototype-note"><Icon name="sparkles" size={15} /> 현재는 같은 브라우저에서 승인 흐름을 확인하는 프로토타입입니다.</p>
          </section>
        ) : currentRequest?.status === "rejected" ? (
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
            <p>계정 생성 없이 길드 관리자의 승인을 받은 브라우저만 이용할 수 있습니다.</p>
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
              <button className="button primary" type="submit">접근 요청 보내기 <Icon name="chevron" size={18} /></button>
            </form>
            <p className="access-footnote">승인 정보는 현재 브라우저에 저장됩니다. 새 기기에서는 다시 요청해야 합니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}
