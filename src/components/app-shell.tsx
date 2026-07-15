import { Icon } from "@/components/icon";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "길드 홈", icon: "home" as const },
  { label: "공덱 검색", icon: "swords" as const, active: true },
  { label: "방덱 관리", icon: "shield" as const },
  { label: "몬스터 도감", icon: "book" as const },
  { label: "길드 관리", icon: "users" as const },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <span><strong>길드 아카이브</strong><small>코난 길드</small></span>
        </div>
        <nav aria-label="주 메뉴" className="sidebar-nav">
          {navItems.map((item) => (
            <a className={item.active ? "active" : ""} href="#" key={item.label}>
              <Icon name={item.icon} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="sparkles" size={16} />
          <span>실제 게임 이미지는 권리 확인 후 연결됩니다.</span>
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
          {navItems.slice(0, 4).map((item) => (
            <a className={item.active ? "active" : ""} href="#" key={item.label}>
              <Icon name={item.icon} size={19} />
              <span>{item.label.replace(" 검색", "").replace(" 관리", "")}</span>
            </a>
          ))}
          <a href="#"><Icon name="menu" size={19} /><span>더보기</span></a>
        </nav>
      </div>
    </div>
  );
}

