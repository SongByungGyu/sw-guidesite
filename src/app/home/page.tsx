import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { GuildHome } from "@/components/guild-home";

export const metadata: Metadata = { title: "길드 홈 · 길드 아카이브" };
export default function GuildHomePage() { return <AccessGate><GuildHome /></AccessGate>; }
