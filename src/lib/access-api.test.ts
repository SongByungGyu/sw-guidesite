import { describe, expect, it } from "vitest";
import { accessLoginInputSchema, accessRequestInputSchema, changeRequestStatusInputSchema, memberRoleInputSchema, normalizeLoginId } from "@/lib/access-api";

describe("access request validation", () => {
  it("accepts a code-free nickname request", () => {
    const result = accessRequestInputSchema.safeParse({
      nickname: "질투길드원",
      loginId: "Jiltu.Member",
      password: "guild1234",
      message: "가입 승인 부탁드립니다.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a nickname shorter than two characters", () => {
    const result = accessRequestInputSchema.safeParse({ nickname: "길", loginId: "user1", password: "guild1234", message: "" });
    expect(result.success).toBe(false);
  });

  it("normalizes login ids and requires a strong-enough password", () => {
    expect(normalizeLoginId("  Jiltu.Member  ")).toBe("jiltu.member");
    expect(accessLoginInputSchema.safeParse({ loginId: "member_01", password: "guild1234" }).success).toBe(true);
    expect(accessLoginInputSchema.safeParse({ loginId: "한글아이디", password: "guild1234" }).success).toBe(false);
    expect(accessLoginInputSchema.safeParse({ loginId: "member_01", password: "password" }).success).toBe(false);
  });

  it("accepts only supported change request workflow states", () => {
    expect(changeRequestStatusInputSchema.safeParse({ status: "PENDING" }).success).toBe(true);
    expect(changeRequestStatusInputSchema.safeParse({ status: "IN_PROGRESS" }).success).toBe(true);
    expect(changeRequestStatusInputSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
    expect(changeRequestStatusInputSchema.safeParse({ status: "CANCELLED" }).success).toBe(false);
  });
});

describe("member role validation", () => {
  it.each(["MEMBER", "OFFICER"])("allows the %s role", (role) => {
    expect(memberRoleInputSchema.safeParse({ role }).success).toBe(true);
  });

  it("does not allow assigning the owner role", () => {
    expect(memberRoleInputSchema.safeParse({ role: "OWNER" }).success).toBe(false);
  });
});
