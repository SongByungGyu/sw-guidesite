import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { HomeworkBoard } from "@/components/homework-board";
export const metadata: Metadata = { title: "길드 숙제 · 길드 아카이브" };
export default function HomeworksPage() { return <AccessGate><HomeworkBoard /></AccessGate>; }
