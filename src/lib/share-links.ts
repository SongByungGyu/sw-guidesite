import type { Route } from "next";

export type SharedHomeContentKind = "announcement" | "schedule" | "homework";

export function createSharedContentPath(kind: SharedHomeContentKind, id: string): Route {
  const encodedId = encodeURIComponent(id);
  if (kind === "homework") return `/homeworks?homework=${encodedId}` as Route;
  return `/home?detail=${kind}&id=${encodedId}` as Route;
}

export function readSharedHomeDetail(search: string) {
  const params = new URLSearchParams(search);
  const kind = params.get("detail");
  const id = params.get("id")?.trim();
  if ((kind !== "announcement" && kind !== "schedule") || !id) return null;
  return { kind, id } as const;
}

export function readSharedHomeworkId(search: string) {
  return new URLSearchParams(search).get("homework")?.trim() || null;
}
