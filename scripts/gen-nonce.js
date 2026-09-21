const { createClient } = require("@libsql/client");
const crypto = require("crypto");

const db = createClient({
  url: "https://equipe-ademilson-ademilsonls.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjU1ODQsImlkIjoiMDFhMDk4MzgtYWIwMS03ZmY0LWI0NDEtYTlhZGM2MjgzZTdjIiwia2lkIjoia284SmpmcEhHb3pPYUtxSzBIbzhJUlVoN3d1cHhxS1dSb3BvZE8zQmlwQSIsInJpZCI6ImY4OTUwMjA2LTA1ZWYtNGJhYy05N2YwLTMxNjRhYzY1ZjJkYiJ9.Nl8GV9k4YgH0uvXCoc4DWzRTHl8azt2_bc_1DKb8PvHBf1QVppp2rNBHGLeQ_D9bxSXSQBLrjDmOadRX_ZIhCA"
});

async function main() {
  const platform = process.argv[2] || "instagram";
  if (!["instagram", "facebook", "youtube", "tiktok", "pinterest", "reddit"].includes(platform)) {
    console.error("Usage: node gen-nonce.js <platform>");
    process.exit(1);
  }

  await db.execute(`CREATE TABLE IF NOT EXISTS oauth_nonces (
    nonce TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  const nonce = crypto.randomBytes(32).toString("hex");
  const ttlMs = 5 * 60 * 1000;
  const expiresAt = Math.floor(Date.now() / 1000) + Math.floor(ttlMs / 1000);

  await db.execute({
    sql: "INSERT OR REPLACE INTO oauth_nonces (nonce, platform, expires_at) VALUES (?, ?, ?)",
    args: [nonce, platform, expiresAt],
  });

  console.log("NONCE=" + nonce);
  console.log("PLATFORM=" + platform);
  console.log("EXPIRES=" + new Date(expiresAt * 1000).toISOString());
}

main().catch(e => { console.error(e.message); process.exit(1); });
