import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AccessGate } from "@/components/access-gate";
import { SpeedCalculator, type SpeedCalculatorDataset } from "@/components/speed-calculator";

export const metadata: Metadata = { title: "공속 계산기 · 길드 아카이브" };

export default async function SpeedCalculatorPage() {
  const source = await readFile(path.join(process.cwd(), "src/data/speed-calculator.json"), "utf8");
  const speedData = JSON.parse(source) as SpeedCalculatorDataset;

  return <AccessGate><SpeedCalculator speedData={speedData} /></AccessGate>;
}
