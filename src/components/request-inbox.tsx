"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { reviewAccessRequest } from "@/lib/access-request";
import {
  clearAccessDemo,
  saveAccessRequests,
  useAccessRequests,
} from "@/lib/access-request-store";

export function RequestInbox() {
  const requests = useAccessRequests();
  const pending = requests.filter((request) => request.status === "pending");
  const reviewed = requests.filter((request) => request.status !== "pending");

  function review(id: string, status: "approved" | "rejected") {
    saveAccessRequests(reviewAccessRequest(requests, id, status, new Date().toISOString()));
  }

  return (
    <main className="request-admin-page">
      <div className="request-admin-shell">
        <header className="request-admin-header">
          <div className="access-brand">
            <span className="brand-mark"><Icon name="shield" /></span>
            <div><strong>길드 접근 요청함</strong><span>OFFICER · OWNER</span></div>
          </div>
          <Link className="button secondary" href="/">공덱 화면으로</Link>
        </header>

        <section className="admin-overview">
          <div><span>승인 대기</span><strong>{pending.length}</strong></div>
          <div><span>처리 완료</span><strong>{reviewed.length}</strong></div>
          <p><Icon name="sparkles" size={16} /> 운영 버전에서는 관리자 권한과 서버 감사 로그로 보호됩니다.</p>
        </section>

        <section className="request-list-section" aria-labelledby="pending-requests-title">
          <div className="request-list-heading">
            <div><p className="eyebrow">새 요청</p><h1 id="pending-requests-title">승인 대기 요청</h1></div>
            {requests.length ? <button className="text-button" type="button" onClick={clearAccessDemo}>데모 데이터 초기화</button> : null}
          </div>

          {pending.length ? (
            <div className="request-list">
              {pending.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="request-avatar">{request.nickname.slice(0, 1)}</div>
                  <div className="request-copy">
                    <div><h2>{request.nickname}</h2><span className="access-status pending"><span /> 승인 대기</span></div>
                    <p>{request.message || "요청 메시지가 없습니다."}</p>
                    <dl className="request-meta">
                      <div><dt>길드 코드</dt><dd>{request.guildCode}</dd></div>
                      <div><dt>요청 시각</dt><dd>{formatDate(request.requestedAt)}</dd></div>
                      <div><dt>요청 번호</dt><dd>{request.id.slice(0, 8).toUpperCase()}</dd></div>
                    </dl>
                  </div>
                  <div className="review-actions">
                    <button className="button secondary danger" type="button" onClick={() => review(request.id, "rejected")}>
                      <Icon name="x" size={18} /> 반려
                    </button>
                    <button className="button primary approve" type="button" onClick={() => review(request.id, "approved")}>
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
                  <span>{request.guildCode}</span>
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
