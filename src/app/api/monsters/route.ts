import { NextRequest, NextResponse } from "next/server";
import { monsters, type Element } from "@/lib/monster-data";

const elements = new Set<Element>(["FIRE", "WATER", "WIND", "LIGHT", "DARK"]);

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const elementParam = request.nextUrl.searchParams.get("element")?.toUpperCase() ?? "";
  const gradeParam = Number(request.nextUrl.searchParams.get("grade"));
  const cursor = Math.max(0, Number(request.nextUrl.searchParams.get("cursor")) || 0);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 60));
  const element = elements.has(elementParam as Element) ? elementParam as Element : null;
  const grade = [2, 3, 4, 5].includes(gradeParam) ? gradeParam : null;

  const filtered = monsters.filter((monster) => {
    const matchesQuery = !query
      || `${monster.displayName} ${monster.englishName}`.toLowerCase().includes(query);
    return matchesQuery
      && (!element || monster.element === element)
      && (!grade || monster.grade === grade);
  });
  const data = filtered.slice(cursor, cursor + limit);
  const nextCursor = cursor + data.length < filtered.length ? cursor + data.length : null;

  return NextResponse.json({ data, nextCursor, total: filtered.length });
}
