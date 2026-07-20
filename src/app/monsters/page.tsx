import { AccessGate } from "@/components/access-gate";
import { MonsterArchive } from "@/components/monster-archive";

export default function MonstersPage() {
  return <AccessGate><MonsterArchive /></AccessGate>;
}
