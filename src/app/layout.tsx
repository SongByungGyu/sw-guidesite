import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "길드 아카이브",
  description: "점령전 공덱 검색과 전투 기록을 위한 길드 전용 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

