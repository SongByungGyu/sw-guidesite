import { AccessGate } from "@/components/access-gate";
import { OffenseSearch } from "@/components/offense-search";

export default function Home() {
  return <AccessGate><OffenseSearch /></AccessGate>;
}
