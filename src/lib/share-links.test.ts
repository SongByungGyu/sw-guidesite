import { describe, expect, it } from "vitest";
import { createSharedContentPath, readSharedHomeDetail, readSharedHomeworkId } from "@/lib/share-links";

describe("shared content links", () => {
  it("creates direct announcement and schedule links", () => {
    expect(createSharedContentPath("announcement", "notice 1")).toBe("/home?detail=announcement&id=notice%201");
    expect(createSharedContentPath("schedule", "schedule-1")).toBe("/home?detail=schedule&id=schedule-1");
  });

  it("creates a direct homework link", () => {
    expect(createSharedContentPath("homework", "homework-1")).toBe("/homeworks?homework=homework-1");
  });

  it("reads only valid shared content parameters", () => {
    expect(readSharedHomeDetail("?detail=announcement&id=notice-1")).toEqual({ kind: "announcement", id: "notice-1" });
    expect(readSharedHomeDetail("?detail=homework&id=homework-1")).toBeNull();
    expect(readSharedHomeworkId("?homework=homework-1")).toBe("homework-1");
  });
});
