"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BuildDetails, BuildSummary, type MonsterBuildDraft } from "@/components/team-build-editor";
import { Icon } from "@/components/icon";
import { ChangeRequestWidget } from "@/components/change-request-widget";
import { KakaoShareButton } from "@/components/kakao-share-button";

type Schedule = { id: string; title: string; category: string; startsAt: string; endsAt?: string };
type Announcement = { id: string; title: string; content: string; pinned: boolean; author: string; createdAt: string };
type HomeworkPreview = { id: string; title: string; target: string; strategy: string; dueAt?: string; author: string; completedByMe: boolean; monsters: MonsterBuildDraft[] };
type HomeDetail = { kind: "announcement"; item: Announcement } | { kind: "schedule"; item: Schedule } | { kind: "homework"; item: HomeworkPreview };
type HomeData = {
  member: { nickname: string; role: string };
  canManage: boolean;
  announcements: Announcement[];
  schedules: Schedule[];
  homeworks: HomeworkPreview[];
};

export function GuildHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [editor, setEditor] = useState<"announcement" | "schedule" | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState<"announcement" | "schedule" | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<string | null>(null);
  const [detail, setDetail] = useState<HomeDetail | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setData(await fetchHomeData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "길드 홈을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void fetchHomeData().then(setData).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "길드 홈을 불러오지 못했습니다.");
    });
  }, []);

  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving("announcement");
    setError("");
    const response = await fetch(editingAnnouncement ? `/api/announcements/${editingAnnouncement.id}` : "/api/announcements", {
      method: editingAnnouncement ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), content: form.get("content"), pinned: form.get("pinned") === "on" }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(result.error ?? "공지를 저장하지 못했습니다.");
    else {
      formElement.reset();
      setEditor(null);
      setEditingAnnouncement(null);
      await load();
    }
    setSaving(null);
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startsAt = String(form.get("startsAt") ?? "");
    const endsAt = String(form.get("endsAt") ?? "");
    setSaving("schedule");
    setError("");
    const response = await fetch(editingSchedule ? `/api/schedules/${editingSchedule.id}` : "/api/schedules", {
      method: editingSchedule ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        category: form.get("category"),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(result.error ?? "일정을 저장하지 못했습니다.");
    else {
      formElement.reset();
      setEditor(null);
      setEditingSchedule(null);
      await load();
    }
    setSaving(null);
  }

  async function deleteSchedule(schedule: Schedule) {
    if (!window.confirm(`'${schedule.title}' 일정을 삭제할까요?`)) return;
    setDeletingSchedule(schedule.id);
    setError("");
    const response = await fetch(`/api/schedules/${schedule.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(result.error ?? "일정을 삭제하지 못했습니다.");
    else await load();
    setDeletingSchedule(null);
  }

  async function deleteAnnouncement(announcement: Announcement) {
    if (!window.confirm(`'${announcement.title}' 공지를 삭제할까요?`)) return;
    setDeletingAnnouncement(announcement.id);
    setError("");
    const response = await fetch(`/api/announcements/${announcement.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(result.error ?? "공지를 삭제하지 못했습니다.");
    else await load();
    setDeletingAnnouncement(null);
  }

  function openAnnouncementEditor(announcement: Announcement | null) {
    setEditingAnnouncement(announcement);
    setEditingSchedule(null);
    setEditor("announcement");
  }

  function openScheduleEditor(schedule: Schedule | null) {
    setEditingSchedule(schedule);
    setEditingAnnouncement(null);
    setEditor("schedule");
  }

  return (
    <AppShell activeSection="home">
      <div className="home-welcome">
        <div><p className="eyebrow">오늘의 길드 브리핑</p><h1>{data ? <>{data.member.nickname}님, <span className="welcome-line">반갑습니다</span></> : "길드 정보를 불러오는 중입니다"}</h1><p>공지와 마감 일정을 확인하고 오늘 필요한 공격을 바로 준비하세요.</p></div>
        <Link className="button primary" href="/"><Icon name="swords" size={18} /> 공덱 검색 시작</Link>
      </div>

      <section className="home-kpis" aria-label="길드 요약">
        <div><span>새 공지</span><strong>{data?.announcements.length ?? "—"}</strong><small>최근 안내</small></div>
        <div><span>진행 숙제</span><strong>{data?.homeworks.length ?? "—"}</strong><small>길드 공통</small></div>
        <div><span>다가오는 일정</span><strong>{data?.schedules.length ?? "—"}</strong><small>예정된 일정</small></div>
        <div className="home-kpi-accent"><span>내 권한</span><strong>{translateRole(data?.member.role)}</strong><small>서버 검증</small></div>
      </section>

      {error ? <p className="form-error home-management-error">{error}</p> : null}

      <div className="home-grid">
        <section className="home-panel home-announcements">
          <header><div><p className="eyebrow">NOTICE</p><h2>공지사항</h2></div><div className="home-panel-actions"><span>{data?.announcements.length ?? 0}건</span>{data?.canManage ? <button className="button secondary home-action-button" onClick={() => { if (editor === "announcement") { setEditor(null); setEditingAnnouncement(null); } else openAnnouncementEditor(null); }} type="button"><Icon name={editor === "announcement" ? "x" : "plus"} size={16} />{editor === "announcement" ? "닫기" : "공지 작성"}</button> : null}</div></header>
          {editor === "announcement" ? <form className="home-manage-form" key={editingAnnouncement?.id ?? "new-announcement"} onSubmit={saveAnnouncement}><div className="simple-fields"><label className="span-full"><span>공지 제목</span><input autoFocus defaultValue={editingAnnouncement?.title} maxLength={80} minLength={2} name="title" placeholder="예: 점령전 공격 전 방덱 확인" required /></label><label className="span-full"><span>공지 내용</span><textarea defaultValue={editingAnnouncement?.content} maxLength={2000} minLength={4} name="content" placeholder="길드원이 확인해야 할 내용을 적어주세요." required /></label></div><label className="pin-option"><input defaultChecked={editingAnnouncement?.pinned} name="pinned" type="checkbox" /><span><strong>필독으로 표시</strong><small>공지 목록 상단에 고정됩니다.</small></span></label><footer><button className="button secondary" onClick={() => { setEditor(null); setEditingAnnouncement(null); }} type="button">취소</button><button className="button primary" disabled={saving === "announcement"} type="submit">{saving === "announcement" ? "저장 중" : editingAnnouncement ? "공지 수정" : "공지 게시"}</button></footer></form> : null}
          <div className="announcement-list">
            {data?.announcements.length ? data.announcements.map((item) => <article aria-haspopup="dialog" className="home-content-card" key={item.id} onClick={() => setDetail({ kind: "announcement", item })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetail({ kind: "announcement", item }); } }} role="button" tabIndex={0}><div>{item.pinned ? <span className="pin-badge">필독</span> : null}<h3>{item.title}</h3><span className="content-admin-actions" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><KakaoShareButton category="공지사항" compact description={item.content} path="/home" title={item.title} />{data.canManage ? <><button aria-label={`${item.title} 공지 수정`} onClick={() => openAnnouncementEditor(item)} title="공지 수정" type="button"><Icon name="edit" size={15} /></button><button aria-label={`${item.title} 공지 삭제`} className="danger-icon" disabled={deletingAnnouncement === item.id} onClick={() => void deleteAnnouncement(item)} title="공지 삭제" type="button"><Icon name="trash" size={15} /></button></> : null}</span></div><p>{item.content}</p><small>{item.author} · {formatRelative(item.createdAt)} · 눌러서 상세 보기</small></article>) : <div className="home-empty"><Icon name="bell" size={20} /><p>등록된 공지가 없습니다.</p></div>}
          </div>
        </section>

        <section className="home-panel home-schedule">
          <header><div><p className="eyebrow">SCHEDULE</p><h2>다가오는 일정</h2></div>{data?.canManage ? <button className="button secondary home-action-button" onClick={() => { if (editor === "schedule") { setEditor(null); setEditingSchedule(null); } else openScheduleEditor(null); }} type="button"><Icon name={editor === "schedule" ? "x" : "plus"} size={16} />{editor === "schedule" ? "닫기" : "일정 추가"}</button> : null}</header>
          {editor === "schedule" ? <form className="home-manage-form schedule-create-form" key={editingSchedule?.id ?? "new-schedule"} onSubmit={saveSchedule}><div className="simple-fields"><label className="span-full"><span>일정 제목</span><input autoFocus defaultValue={editingSchedule?.title} maxLength={80} minLength={2} name="title" placeholder="예: 점령전 공격 마감" required /></label><label><span>종류</span><select defaultValue={editingSchedule?.category ?? "점령전"} name="category"><option>점령전</option><option>길드전</option><option>미궁</option><option>레이드</option><option>길드 공지</option><option>기타</option></select></label><label><span>시작</span><input defaultValue={editingSchedule ? toDateTimeLocal(editingSchedule.startsAt) : undefined} name="startsAt" required type="datetime-local" /></label><label><span>종료 (선택)</span><input defaultValue={editingSchedule?.endsAt ? toDateTimeLocal(editingSchedule.endsAt) : undefined} name="endsAt" type="datetime-local" /></label></div><footer><button className="button secondary" onClick={() => { setEditor(null); setEditingSchedule(null); }} type="button">취소</button><button className="button primary" disabled={saving === "schedule"} type="submit">{saving === "schedule" ? "저장 중" : editingSchedule ? "일정 수정" : "일정 저장"}</button></footer></form> : null}
          <div className="schedule-list">
            {data?.schedules.length ? data.schedules.map((item) => <article aria-haspopup="dialog" className="home-content-card" key={item.id} onClick={() => setDetail({ kind: "schedule", item })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetail({ kind: "schedule", item }); } }} role="button" tabIndex={0}><time dateTime={item.startsAt}><strong>{new Date(item.startsAt).getDate()}</strong><span>{new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(new Date(item.startsAt))}</span></time><div className="schedule-copy"><span>{item.category}</span><h3>{item.title}</h3><p>{formatScheduleTime(item.startsAt, item.endsAt)} · 상세 보기</p></div><span className="content-admin-actions" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><KakaoShareButton category={`일정 · ${item.category}`} compact description={formatScheduleTime(item.startsAt, item.endsAt)} path="/home" title={item.title} />{data.canManage ? <><button aria-label={`${item.title} 일정 수정`} onClick={() => openScheduleEditor(item)} title="일정 수정" type="button"><Icon name="edit" size={16} /></button><button aria-label={`${item.title} 일정 삭제`} className="danger-icon" disabled={deletingSchedule === item.id} onClick={() => void deleteSchedule(item)} title="일정 삭제" type="button"><Icon name="trash" size={16} /></button></> : null}</span></article>) : <div className="home-empty"><Icon name="bell" size={20} /><p>예정된 일정이 없습니다.</p></div>}
          </div>
        </section>

        <section className="home-panel home-homework">
          <header><div><p className="eyebrow">TODAY</p><h2>진행 중인 길드 숙제</h2></div><Link href="/homeworks">전체 보기</Link></header>
          {data?.homeworks.map((item) => <article aria-haspopup="dialog" className="homework-preview home-content-card" key={item.id} onClick={() => setDetail({ kind: "homework", item })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetail({ kind: "homework", item }); } }} role="button" tabIndex={0}><div className="homework-preview-copy"><span className="status-pill">{item.completedByMe ? "내 숙제 완료" : "진행 중"}</span><h3>{item.title}</h3><p>{item.target}</p><small>{item.dueAt ? `${formatDate(item.dueAt)} 마감` : "기한 없음"} · 작성 {item.author} · 눌러서 상세 보기</small><span className="homework-preview-share" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><KakaoShareButton category="길드 숙제" description={`${item.target} · ${item.dueAt ? `${formatDate(item.dueAt)} 마감` : "기한 없음"}`} path="/homeworks" title={item.title} /></span></div><BuildSummary builds={item.monsters} /></article>)}
        </section>

        <section className="home-panel quick-links">
          <header><div><p className="eyebrow">QUICK START</p><h2>바로가기</h2></div></header>
          <div><Link href="/defenses"><Icon name="shield" /><span><strong>방덱 스펙 정리</strong><small>3마리와 룬·속도 저장</small></span><Icon name="chevron" size={18} /></Link><Link href="/dungeons"><Icon name="book" /><span><strong>던전 공략 찾기</strong><small>카이로스부터 인페라스까지</small></span><Icon name="chevron" size={18} /></Link></div>
        </section>
      </div>
      {data ? <ChangeRequestWidget canManage={data.canManage} /> : null}
      <HomeContentDetail detail={detail} onClose={() => setDetail(null)} />
    </AppShell>
  );
}

function HomeContentDetail({ detail, onClose }: { detail: HomeDetail | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (detail && dialog && !dialog.open) dialog.showModal();
  }, [detail]);

  if (!detail) return null;

  const title = detail.item.title;
  const close = () => dialogRef.current?.close();
  return <dialog aria-labelledby="home-detail-title" className="monster-dialog home-detail-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} onClose={onClose} ref={dialogRef}>
    <div className="home-detail-shell">
      <header className="dialog-header"><div><p className="eyebrow">{detail.kind === "announcement" ? "NOTICE DETAIL" : detail.kind === "schedule" ? "SCHEDULE DETAIL" : "MISSION DETAIL"}</p><h2 id="home-detail-title">{title}</h2></div><button aria-label="상세 팝업 닫기" className="icon-button" onClick={close} type="button"><Icon name="x" /></button></header>
      <div className="home-detail-body">
        {detail.kind === "announcement" ? <>
          <section className="home-detail-overview"><div><span>구분</span><strong>{detail.item.pinned ? "필독 공지" : "공지사항"}</strong></div><div><span>작성자</span><strong>{detail.item.author}</strong></div><div><span>게시일</span><strong>{formatFullDate(detail.item.createdAt)}</strong></div></section>
          <section className="home-detail-copy"><span>공지 내용</span><p>{detail.item.content}</p></section>
        </> : detail.kind === "schedule" ? <>
          <section className="home-detail-overview"><div><span>일정 종류</span><strong>{detail.item.category}</strong></div><div><span>시작</span><strong>{formatFullDate(detail.item.startsAt)}</strong></div><div><span>종료</span><strong>{detail.item.endsAt ? formatFullDate(detail.item.endsAt) : "종료 시간 없음"}</strong></div></section>
          <section className="home-detail-copy"><span>일정 안내</span><p>{formatScheduleTime(detail.item.startsAt, detail.item.endsAt)}</p></section>
        </> : <>
          <section className="home-detail-overview"><div><span>상태</span><strong>{detail.item.completedByMe ? "내 숙제 완료" : "진행 중"}</strong></div><div><span>작성자</span><strong>{detail.item.author}</strong></div><div><span>마감</span><strong>{detail.item.dueAt ? formatFullDate(detail.item.dueAt) : "기한 없음"}</strong></div></section>
          <section className="home-detail-copy"><span>추천 공격 대상</span><p>{detail.item.target}</p></section>
          <section className="home-detail-copy"><span>운용 지시</span><p>{detail.item.strategy}</p></section>
          <section className="home-detail-builds"><header><div><h3>공덱 몬스터 스펙</h3><p>룬 세트와 등록된 최소 스펙을 확인하세요.</p></div><span>3마리</span></header><BuildDetails builds={detail.item.monsters} /></section>
        </>}
      </div>
      <footer className="dialog-footer">
        {detail.kind === "announcement" ? <KakaoShareButton category="공지사항" description={detail.item.content} path="/home" title={title} /> : detail.kind === "schedule" ? <KakaoShareButton category={`일정 · ${detail.item.category}`} description={formatScheduleTime(detail.item.startsAt, detail.item.endsAt)} path="/home" title={title} /> : <KakaoShareButton category="길드 숙제" description={`${detail.item.target} · ${detail.item.dueAt ? `${formatDate(detail.item.dueAt)} 마감` : "기한 없음"}`} path="/homeworks" title={title} />}
        <button className="button secondary" onClick={close} type="button">닫기</button>
        {detail.kind === "homework" ? <Link className="button primary" href="/homeworks">숙제 전체 화면</Link> : null}
      </footer>
    </div>
  </dialog>;
}

function translateRole(role?: string) { return role === "OWNER" ? "길드장" : role === "OFFICER" ? "운영진" : role === "MEMBER" ? "길드원" : "—"; }
async function fetchHomeData() {
  const response = await fetch("/api/home", { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as HomeData & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "길드 홈을 불러오지 못했습니다.");
  return result;
}
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(value)); }
function formatFullDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatRelative(value: string) { return new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" }).format(Math.round((Date.parse(value) - Date.now()) / 86400000), "day"); }
function formatScheduleTime(startsAt: string, endsAt?: string) {
  const start = new Date(startsAt);
  const startLabel = new Intl.DateTimeFormat("ko-KR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(start);
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endLabel = new Intl.DateTimeFormat("ko-KR", sameDay ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(end);
  return `${startLabel} ~ ${endLabel}`;
}
function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
