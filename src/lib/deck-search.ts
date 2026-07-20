import type { Deck } from "@/lib/mock-data";

export type DeckSort = "recommended" | "rate" | "uses" | "latest";
export type DeckMatch = "exact" | "partial" | "none";

export type DeckSearchFilters = {
  sort: DeckSort;
  officialOnly: boolean;
  author: string;
};

export type DeckSearchResult = {
  deck: Deck;
  match: Exclude<DeckMatch, "none">;
};

export function countDefenseOverlap(selectedIds: readonly string[], deckIds: readonly string[]) {
  const selected = new Set(selectedIds);
  return new Set(deckIds.filter((id) => selected.has(id))).size;
}

export function getDeckMatch(selectedIds: readonly string[], deckIds: readonly string[]): DeckMatch {
  const overlap = countDefenseOverlap(selectedIds, deckIds);
  if (selectedIds.length === 3 && deckIds.length === 3 && overlap === 3) return "exact";
  if (overlap >= 2) return "partial";
  return "none";
}

export function searchDecks(
  source: readonly Deck[],
  selectedIds: readonly string[],
  filters: DeckSearchFilters,
): DeckSearchResult[] {
  return source
    .filter((deck) => !filters.officialOnly || deck.isOfficial)
    .filter((deck) => filters.author === "all" || deck.author === filters.author)
    .map((deck) => ({ deck, match: getDeckMatch(selectedIds, deck.defenseIds) }))
    .filter((result): result is DeckSearchResult => result.match !== "none")
    .sort((a, b) => compareDecks(a.deck, b.deck, filters.sort));
}

function compareDecks(a: Deck, b: Deck, sort: DeckSort) {
  if (sort === "rate") return winRate(b) - winRate(a) || b.battles - a.battles;
  if (sort === "uses") return b.battles - a.battles;
  if (sort === "latest") return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  return Number(b.isOfficial) - Number(a.isOfficial) || b.battles - a.battles;
}

function winRate(deck: Deck) {
  return deck.battles === 0 ? -1 : deck.wins / deck.battles;
}
