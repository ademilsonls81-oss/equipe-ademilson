const { createClient } = require("@libsql/client");
const db = createClient({
  url: "https://equipe-ademilson-ademilsonls.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjU1ODQsImlkIjoiMDFhMDk4MzgtYWIwMS03ZmY0LWI0NDEtYTlhZGM2MjgzZTdjIiwia2lkIjoia284SmpmcEhHb3pPYUtxSzBIbzhJUlVoN3d1cHhxS1dSb3BvZE8zQmlwQSIsInJpZCI6ImY4OTUwMjA2LTA1ZWYtNGJhYy05N2YwLTMxNjRhYzY1ZjJkYiJ9.Nl8GV9k4YgH0uvXCoc4DWzRTHl8azt2_bc_1DKb8PvHBf1QVppp2rNBHGLeQ_D9bxSXSQBLrjDmOadRX_ZIhCA"
});

async function main() {
  const accounts = await db.execute("SELECT id, platform, account_name, status, created_at FROM social_accounts WHERE platform = 'instagram'");
  console.log("=== INSTAGRAM ACCOUNTS ===");
  console.log(JSON.stringify(accounts.rows, null, 2));

  const logs = await db.execute("SELECT id, agent_type, action, details, status, error_message, created_at FROM agent_logs WHERE action LIKE '%instagram%' OR details LIKE '%instagram%' ORDER BY id DESC LIMIT 10");
  console.log("\n=== INSTAGRAM LOGS ===");
  console.log(JSON.stringify(logs.rows, null, 2));

  const nonces = await db.execute("SELECT nonce, platform, expires_at FROM oauth_nonces WHERE platform = 'instagram' ORDER BY created_at DESC LIMIT 5");
  console.log("\n=== INSTAGRAM NONCES ===");
  console.log(JSON.stringify(nonces.rows, null, 2));

  const allAccounts = await db.execute("SELECT id, platform, account_name, status FROM social_accounts ORDER BY id DESC LIMIT 10");
  console.log("\n=== ALL RECENT ACCOUNTS ===");
  console.log(JSON.stringify(allAccounts.rows, null, 2));
}

main().catch(e => console.error(e));
