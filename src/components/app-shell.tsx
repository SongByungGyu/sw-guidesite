import { Icon } from "@/components/icon";
import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  activeSection?: "home" | "offense" | "defenses" | "dungeons" | "homeworks" | "monsters";
};

const navItems = [
  { label: "길드 홈", mobileLabel: "홈", icon: "home" as const, href: "/home", section: "home" },
  { label: "공덱 검색", mobileLabel: "공덱", icon: "swords" as const, href: "/", section: "offense" },
  { label: "방덱 관리", mobileLabel: "방덱", icon: "shield" as const, href: "/defenses", section: "defenses" },
  { label: "던전 공략", mobileLabel: "던전", icon: "book" as const, href: "/dungeons", section: "dungeons" },
  { label: "길드 숙제", mobileLabel: "숙제", icon: "check" as const, href: "/homeworks", section: "homeworks" },
  { label: "몬스터 도감", icon: "book" as const, href: "/monsters", section: "monsters" },
  { label: "길드 관리", icon: "users" as const, href: "/requests", section: undefined },
] as const;

export function AppShell({ children, activeSection = "offense" }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <span><strong>길드 아카이브</strong><small>코난 길드</small></span>
        </div>
        <nav aria-label="주 메뉴" className="sidebar-nav">
          {navItems.map((item) => (
            <Link className={item.section === activeSection ? "active" : ""} href={item.href} key={item.label}>
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
            코난 길드 <Icon name="chevron" size={16} />
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
          {navItems.slice(0, 5).map((item) => (
            <Link className={item.section === activeSection ? "active" : ""} href={item.href} key={item.label}>
              <Icon name={item.icon} size={19} />
              <span>{"mobileLabel" in item ? item.mobileLabel : item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
