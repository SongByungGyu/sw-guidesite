import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { DefenseManager } from "@/components/defense-manager";
export const metadata: Metadata = { title: "방덱 관리 · 길드 아카이브" };
export default function DefensesPage() { return <AccessGate><DefenseManager /></AccessGate>; }
