import type { Metadata } from "next";
import { RequestInbox } from "@/components/request-inbox";

export const metadata: Metadata = {
  title: "접근 요청함 · 길드 아카이브",
};

export default function RequestsPage() {
  return <RequestInbox />;
}
