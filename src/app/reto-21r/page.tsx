import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AccessGate } from "@/components/access-gate";
import { RetoDefenseStats, type RetoDataset } from "@/components/reto-defense-stats";

export const metadata: Metadata = { title: "레토 21R 방덱 방성 통계 · 길드 아카이브" };

export default async function Reto21RPage() {
  const source = await readFile(path.join(process.cwd(), "src/data/reto-21r-stats.json"), "utf8");
  const stats = JSON.parse(source) as RetoDataset;

  return <AccessGate><RetoDefenseStats stats={stats} /></AccessGate>;
}
