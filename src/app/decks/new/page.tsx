import type { Metadata } from "next";
import { AccessGate } from "@/components/access-gate";
import { DeckRegistration } from "@/components/deck-registration";
import { defaultDefenseIds } from "@/lib/mock-data";
import { monsters } from "@/lib/monster-data";

export const metadata: Metadata = {
  title: "공덱 등록 · 길드 아카이브",
};

export default async function NewDeckPage({ searchParams }: { searchParams: Promise<{ defense?: string }> }) {
  const params = await searchParams;
  const knownIds = new Set(monsters.map((monster) => monster.id));
  const requestedIds = params.defense?.split(",").filter((id) => knownIds.has(id)) ?? [];
  const initialDefenseIds = requestedIds.length === 3 ? requestedIds : [...defaultDefenseIds];
  return <AccessGate><DeckRegistration initialDefenseIds={initialDefenseIds} /></AccessGate>;
}
