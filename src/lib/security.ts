import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function digestSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function secretsEqual(left: string, right: string) {
  const leftDigest = Buffer.from(digestSecret(left));
  const rightDigest = Buffer.from(digestSecret(right));
  return timingSafeEqual(leftDigest, rightDigest);
}

export function createSignedToken(payload: string, secret: string) {
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySignedToken(token: string, secret: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  if (!secretsEqual(signature, expected)) return null;
  try {
    return Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }
}
