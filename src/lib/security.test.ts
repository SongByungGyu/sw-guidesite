import { describe, expect, it } from "vitest";
import {
  createSignedToken,
  digestSecret,
  secretsEqual,
  verifySignedToken,
} from "@/lib/security";

describe("security helpers", () => {
  const secret = "a-secret-that-is-long-enough-for-tests";

  it("creates a stable one-way digest", () => {
    expect(digestSecret("CONAN-01")).toHaveLength(64);
    expect(digestSecret("CONAN-01")).not.toBe("CONAN-01");
  });

  it("compares secrets without comparing raw values", () => {
    expect(secretsEqual("same", "same")).toBe(true);
    expect(secretsEqual("same", "different")).toBe(false);
  });

  it("rejects a modified signed token", () => {
    const token = createSignedToken("payload", secret);
    expect(verifySignedToken(token, secret)).toBe("payload");
    expect(verifySignedToken(`${token}changed`, secret)).toBeNull();
  });
});
