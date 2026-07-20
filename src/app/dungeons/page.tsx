import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { DungeonGuides } from "@/components/dungeon-guides";
export const metadata: Metadata = { title: "던전 공략 · 길드 아카이브" };
export default function DungeonsPage() { return <AccessGate><DungeonGuides /></AccessGate>; }
