import { describe, expect, it } from "vitest";
import {
  createSignedToken,
  digestSecret,
  hashPassword,
  secretsEqual,
  verifyPassword,
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

  it("hashes passwords with a unique salt and verifies them safely", async () => {
    const first = await hashPassword("guild1234");
    const second = await hashPassword("guild1234");
    expect(first).not.toBe(second);
    await expect(verifyPassword("guild1234", first)).resolves.toBe(true);
    await expect(verifyPassword("wrong1234", first)).resolves.toBe(false);
    await expect(verifyPassword("guild1234", "invalid")).resolves.toBe(false);
  });
});
