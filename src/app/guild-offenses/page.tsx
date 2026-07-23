import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { AppShell } from "@/components/app-shell";
import { GuildOffenseLibrary } from "@/components/guild-offense-library";

export const metadata: Metadata = { title: "길드 공덱 · 길드 아카이브" };

export default function GuildOffensesPage() {
  return (
    <AccessGate>
      <AppShell activeSection="guild-offenses">
        <GuildOffenseLibrary />
      </AppShell>
    </AccessGate>
  );
}
