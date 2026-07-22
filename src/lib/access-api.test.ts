import { describe, expect, it } from "vitest";
import { accessRequestInputSchema, memberRoleInputSchema } from "@/lib/access-api";

describe("access request validation", () => {
  it("accepts a code-free nickname request", () => {
    const result = accessRequestInputSchema.safeParse({
      nickname: "질투길드원",
      message: "가입 승인 부탁드립니다.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a nickname shorter than two characters", () => {
    const result = accessRequestInputSchema.safeParse({ nickname: "길", message: "" });
    expect(result.success).toBe(false);
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
