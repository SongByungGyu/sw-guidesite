"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BuildSummary, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";

type HomeData = {
  member: { nickname: string; role: string };
  announcements: Array<{ id: string; title: string; content: string; pinned: boolean; author: string; createdAt: string }>;
  schedules: Array<{ id: string; title: string; category: string; startsAt: string }>;
  homeworks: Array<{ id: string; title: string; target: string; dueAt?: string; author: string; completedByMe: boolean; monsters: MonsterBuildDraft[] }>;
};

export function GuildHome() {
  const [data, setData] = useState<HomeData | null>(null);
  useEffect(() => { void fetch("/api/home", { cache: "no-store" }).then((response) => response.json()).then(setData); }, []);

  return (
    <AppShell activeSection="home">
      <div className="home-welcome">
        <div><p className="eyebrow">오늘의 길드 브리핑</p><h1>{data ? <>{data.member.nickname}님, <span className="welcome-line">반갑습니다</span></> : "길드 정보를 불러오는 중입니다"}</h1><p>공지와 마감 일정을 확인하고 오늘 필요한 공격을 바로 준비하세요.</p></div>
        <Link className="button primary" href="/"><Icon name="swords" size={18} /> 공덱 검색 시작</Link>
      </div>

      <section className="home-kpis" aria-label="길드 요약">
        <div><span>새 공지</span><strong>{data?.announcements.length ?? "—"}</strong><small>최근 안내</small></div>
        <div><span>진행 숙제</span><strong>{data?.homeworks.length ?? "—"}</strong><small>길드 공통</small></div>
        <div><span>다가오는 일정</span><strong>{data?.schedules.length ?? "—"}</strong><small>7일 이내</small></div>
        <div className="home-kpi-accent"><span>내 권한</span><strong>{translateRole(data?.member.role)}</strong><small>서버 검증</small></div>
      </section>

      <div className="home-grid">
        <section className="home-panel home-announcements">
          <header><div><p className="eyebrow">NOTICE</p><h2>공지사항</h2></div><span>{data?.announcements.length ?? 0}건</span></header>
          <div className="announcement-list">
            {data?.announcements.map((item) => <article key={item.id}><div>{item.pinned ? <span className="pin-badge">필독</span> : null}<h3>{item.title}</h3></div><p>{item.content}</p><small>{item.author} · {formatRelative(item.createdAt)}</small></article>)}
          </div>
        </section>

        <section className="home-panel home-schedule">
          <header><div><p className="eyebrow">SCHEDULE</p><h2>다가오는 일정</h2></div></header>
          <div className="schedule-list">
            {data?.schedules.map((item) => <article key={item.id}><time><strong>{new Date(item.startsAt).getDate()}</strong><span>{new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(new Date(item.startsAt))}</span></time><div><span>{item.category}</span><h3>{item.title}</h3><p>{new Intl.DateTimeFormat("ko-KR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.startsAt))}</p></div></article>)}
          </div>
        </section>

        <section className="home-panel home-homework">
          <header><div><p className="eyebrow">TODAY</p><h2>진행 중인 길드 숙제</h2></div><Link href="/homeworks">전체 보기</Link></header>
          {data?.homeworks.map((item) => <article className="homework-preview" key={item.id}><div className="homework-preview-copy"><span className="status-pill">{item.completedByMe ? "내 숙제 완료" : "진행 중"}</span><h3>{item.title}</h3><p>{item.target}</p><small>{item.dueAt ? `${formatDate(item.dueAt)} 마감` : "기한 없음"} · 작성 {item.author}</small></div><BuildSummary builds={item.monsters} /></article>)}
        </section>

        <section className="home-panel quick-links">
          <header><div><p className="eyebrow">QUICK START</p><h2>바로가기</h2></div></header>
          <div><Link href="/defenses"><Icon name="shield" /><span><strong>방덱 스펙 정리</strong><small>3마리와 룬·속도 저장</small></span><Icon name="chevron" size={18} /></Link><Link href="/dungeons"><Icon name="book" /><span><strong>던전 공략 찾기</strong><small>카이로스부터 인페라스까지</small></span><Icon name="chevron" size={18} /></Link></div>
        </section>
      </div>
    </AppShell>
  );
}

function translateRole(role?: string) { return role === "OWNER" ? "길드장" : role === "OFFICER" ? "운영진" : role === "MEMBER" ? "길드원" : "—"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(value)); }
function formatRelative(value: string) { return new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" }).format(Math.round((Date.parse(value) - Date.now()) / 86400000), "day"); }
