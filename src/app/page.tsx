import { AccessGate } from "@/components/access-gate";
import { OffenseSearch } from "@/components/offense-search";
import { monsters } from "@/lib/monster-data";

export default async function Home({ searchParams }: { searchParams: Promise<{ defense?: string }> }) {
  const params = await searchParams;
  const knownIds = new Set(monsters.map((monster) => monster.id));
  const requestedIds = params.defense?.split(",").filter((id) => knownIds.has(id)) ?? [];
  const initialDefenseIds = requestedIds.length === 3 ? requestedIds : [];
  return <AccessGate><OffenseSearch initialDefenseIds={initialDefenseIds} /></AccessGate>;
}
