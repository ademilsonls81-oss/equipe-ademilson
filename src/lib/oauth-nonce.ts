// Nonce storage using Turso database for serverless compatibility

import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// Ensure table exists
async function ensureTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS oauth_nonces (
      nonce TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
}

export async function storeNonce(nonce: string, platform: string, ttlMs: number = 5 * 60 * 1000): Promise<void> {
  await ensureTable();
  const db = getDb();
  const expiresAt = Math.floor(Date.now() / 1000) + Math.floor(ttlMs / 1000);
  
  await db.execute({
    sql: "INSERT OR REPLACE INTO oauth_nonces (nonce, platform, expires_at) VALUES (?, ?, ?)",
    args: [nonce, platform, expiresAt],
  });

  // Verify storage
  const verify = await db.execute({
    sql: "SELECT nonce, platform, expires_at FROM oauth_nonces WHERE nonce = ?",
    args: [nonce],
  });
  
  if (verify.rows.length === 0) {
    console.error(`[OAUTH NONCE] FAILED TO STORE nonce=${nonce.substring(0, 16)}... platform=${platform}`);
  } else {
    console.log(`[OAUTH NONCE] STORED nonce=${nonce.substring(0, 16)}... platform=${platform} expires_at=${expiresAt} verify_rows=${verify.rows.length}`);
  }
}

export async function validateNonce(nonce: string, platform: string): Promise<boolean> {
  await ensureTable();
  const db = getDb();
  
  console.log(`[OAUTH NONCE] VALIDATING nonce=${nonce.substring(0, 16)}... platform=${platform}`);

  const result = await db.execute({
    sql: "SELECT platform, expires_at FROM oauth_nonces WHERE nonce = ?",
    args: [nonce],
  });

  console.log(`[OAUTH NONCE] FOUND rows=${result.rows.length}`);

  if (result.rows.length === 0) {
    // Debug: list all nonces for this platform
    const allNonces = await db.execute({
      sql: "SELECT nonce, platform, expires_at FROM oauth_nonces WHERE platform = ?",
      args: [platform],
    });
    console.log(`[OAUTH NONCE] ALL ${platform} nonces: ${JSON.stringify(allNonces.rows.map((r: any) => ({ nonce: r.nonce?.substring(0, 16), expires_at: r.expires_at })))}`);
    return false;
  }

  const row = result.rows[0] as any;
  const now = Math.floor(Date.now() / 1000);

  if (row.expires_at < now) {
    await db.execute({ sql: "DELETE FROM oauth_nonces WHERE nonce = ?", args: [nonce] });
    console.log(`[OAUTH NONCE] EXPIRED expires_at=${row.expires_at} now=${now}`);
    return false;
  }

  if (row.platform !== platform) {
    console.log(`[OAUTH NONCE] PLATFORM MISMATCH expected=${platform} got=${row.platform}`);
    return false;
  }

  await db.execute({ sql: "DELETE FROM oauth_nonces WHERE nonce = ?", args: [nonce] });
  console.log(`[OAUTH NONCE] VALID`);
  return true;
}
