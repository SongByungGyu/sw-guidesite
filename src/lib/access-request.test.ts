import { describe, expect, it } from "vitest";
import {
  createAccessRequest,
  parseAccessRequests,
  reviewAccessRequest,
} from "@/lib/access-request";

describe("access request", () => {
  const request = createAccessRequest(
    { nickname: "  별빛 ", guildCode: " conan-01 ", message: "  길드원입니다. " },
    { id: "request-1", now: "2026-07-20T12:00:00.000Z" },
  );

  it("입력값을 정리해 승인 대기 요청을 만든다", () => {
    expect(request).toMatchObject({
      id: "request-1",
      nickname: "별빛",
      guildCode: "CONAN-01",
      message: "길드원입니다.",
      status: "pending",
    });
  });

  it("요청을 승인하거나 반려할 수 있다", () => {
    const approved = reviewAccessRequest([request], request.id, "approved", "2026-07-20T12:10:00.000Z");
    expect(approved[0]).toMatchObject({ status: "approved", reviewedAt: "2026-07-20T12:10:00.000Z" });
    expect(request.status).toBe("pending");
  });

  it("손상된 저장 데이터는 안전하게 무시한다", () => {
    expect(parseAccessRequests("not-json")).toEqual([]);
    expect(parseAccessRequests(JSON.stringify([{ id: 1 }]))).toEqual([]);
    expect(parseAccessRequests(JSON.stringify([request]))).toEqual([request]);
  });
});
