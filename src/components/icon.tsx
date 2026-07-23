import type { ReactNode, SVGProps } from "react";

type IconName =
  | "home"
  | "swords"
  | "shield"
  | "book"
  | "users"
  | "search"
  | "bell"
  | "chevron"
  | "check"
  | "crown"
  | "plus"
  | "trash"
  | "edit"
  | "x"
  | "menu"
  | "share"
  | "bolt"
  | "sparkles";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  swords: <><path d="m14.5 17.5 3 3" /><path d="m3 21 6.5-6.5" /><path d="M14 3l7 7-4 1-3 3-1 4-7-7 3-1 4-4Z" /><path d="m5 3 4 4" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3 7.8 7.5 9.5 4.5-1.7 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2 2 4-4" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  crown: <><path d="m3 6 4 4 5-7 5 7 4-4-2 12H5Z" /><path d="M5 21h14" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4" /><path d="m8.6 13.5 6.8 4" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7Z" />,
  sparkles: <><path d="m12 3-1 3-3 1 3 1 1 3 1-3 3-1-3-1Z" /><path d="m5 14-1 2-2 1 2 1 1 2 1-2 2-1-2-1Z" /><path d="m19 13-1 2-2 1 2 1 1 2 1-2 2-1-2-1Z" /></>,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
