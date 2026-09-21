import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    // Fallback: derive from CRON_SECRET (só para não quebrar em dev local)
    const { createHash } = require("crypto");
    return createHash("sha256").update(process.env.CRON_SECRET || "equipe-ademilson-dev-key").digest();
  }
  const buf = Buffer.from(key, "hex");
  if (buf.length !== KEY_LENGTH) throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return buf;
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv(16) + authTag(16) + encrypted — all as hex
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

export function decryptToken(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  // Se não tem tamanho par de hex ou é muito curto, pode ser texto puro (migração)
  if (ciphertext.length < 32 || ciphertext.length % 2 !== 0) return ciphertext;
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, "hex");
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) return ciphertext; // texto puro
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    return ciphertext; // fallback: texto puro
  }
}
