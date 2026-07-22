import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

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

function derivePassword(password: string, salt: string, cost: number, blockSize: number, parallelization: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: 64 * 1024 * 1024,
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await derivePassword(password, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION);
  return ["scrypt", SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION, salt, derivedKey.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, costValue, blockSizeValue, parallelizationValue, salt, encodedHash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !encodedHash) return false;
  const cost = Number(costValue);
  const blockSize = Number(blockSizeValue);
  const parallelization = Number(parallelizationValue);
  if (![cost, blockSize, parallelization].every(Number.isSafeInteger)) return false;
  if (cost < 2 || cost > 65536 || blockSize < 1 || blockSize > 32 || parallelization < 1 || parallelization > 8) return false;
  try {
    const expected = Buffer.from(encodedHash, "base64url");
    const actual = await derivePassword(password, salt, cost, blockSize, parallelization);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
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
