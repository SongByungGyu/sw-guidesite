"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  activeSection?: "home" | "offense" | "guild-offenses" | "speed" | "defenses" | "reto" | "dungeons" | "homeworks" | "monsters";
};

const navItems = [
  { label: "길드 홈", mobileLabel: "홈", icon: "home" as const, href: "/home", section: "home" },
  { label: "공덱 검색", mobileLabel: "공덱", icon: "swords" as const, href: "/", section: "offense" },
  { label: "길드 공덱", mobileLabel: "길드덱", icon: "sparkles" as const, href: "/guild-offenses", section: "guild-offenses" },
  { label: "공속 계산기", mobileLabel: "공속", icon: "bolt" as const, href: "/speed-calculator", section: "speed" },
  { label: "방덱 관리", mobileLabel: "방덱", icon: "shield" as const, href: "/defenses", section: "defenses" },
  { label: "레토 21R 방덱 통계", mobileLabel: "21R", icon: "sparkles" as const, href: "/reto-21r", section: "reto" },
  { label: "던전 공략", mobileLabel: "던전", icon: "book" as const, href: "/dungeons", section: "dungeons" },
  { label: "길드 숙제", mobileLabel: "숙제", icon: "check" as const, href: "/homeworks", section: "homeworks" },
  { label: "몬스터 도감", icon: "book" as const, href: "/monsters", section: "monsters" },
  { label: "길드 관리", icon: "users" as const, href: "/requests", section: undefined },
] as const;

export function AppShell({ children, activeSection = "offense" }: AppShellProps) {
  const pathname = usePathname();

  useEffect(() => {
    const scrollKey = `guild_archive_scroll:${pathname}`;
    let savedScroll = 0;
    try { savedScroll = Number(window.sessionStorage.getItem(scrollKey) ?? 0); } catch { /* 저장소가 막힌 브라우저에서는 기본 위치를 사용합니다. */ }
    const restoreFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: Number.isFinite(savedScroll) ? savedScroll : 0 });
    });
    const savePosition = () => {
      try { window.sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch { /* 스크롤 복원을 지원하지 않는 환경은 무시합니다. */ }
    };
    let ticking = false;
    const saveScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        savePosition();
        ticking = false;
      });
    };
    const saveImmediately = () => savePosition();
    try { window.sessionStorage.setItem("guild_archive_last_path", pathname); } catch { /* 마지막 경로 저장을 지원하지 않는 환경은 무시합니다. */ }
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("pagehide", saveImmediately);
    document.addEventListener("visibilitychange", saveImmediately);
    return () => {
      window.cancelAnimationFrame(restoreFrame);
      saveImmediately();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("pagehide", saveImmediately);
      document.removeEventListener("visibilitychange", saveImmediately);
    };
  }, [pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <span><strong>길드 아카이브</strong><small>질투</small></span>
        </div>
        <nav aria-label="주 메뉴" className="sidebar-nav">
          {navItems.map((item) => (
            <Link className={item.section === activeSection ? "active" : ""} href={item.href as Route} key={item.label}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="sparkles" size={16} />
          <span>몬스터 데이터: ryhlab 기준</span>
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="mobile-brand"><Icon name="shield" /><strong>길드 아카이브</strong></div>
          <button className="guild-switcher" type="button">
            질투 <Icon name="chevron" size={16} />
          </button>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="알림, P1 예정">
              <Icon name="bell" />
            </button>
            <button className="profile-button" type="button" aria-label="내 프로필">
              SB
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <nav className="mobile-tabs" aria-label="모바일 주 메뉴">
          {navItems.slice(0, 6).map((item) => (
            <Link className={item.section === activeSection ? "active" : ""} href={item.href as Route} key={item.label}>
              <Icon name={item.icon} size={19} />
              <span>{"mobileLabel" in item ? item.mobileLabel : item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
