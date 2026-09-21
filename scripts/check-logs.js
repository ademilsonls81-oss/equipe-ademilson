const { createClient } = require("@libsql/client");
const db = createClient({
  url: "https://equipe-ademilson-ademilsonls.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjU1ODQsImlkIjoiMDFhMDk4MzgtYWIwMS03ZmY0LWI0NDEtYTlhZGM2MjgzZTdjIiwia2lkIjoia284SmpmcEhHb3pPYUtxSzBIbzhJUlVoN3d1cHhxS1dSb3BvZE8zQmlwQSIsInJpZCI6ImY4OTUwMjA2LTA1ZWYtNGJhYy05N2YwLTMxNjRhYzY1ZjJkYiJ9.Nl8GV9k4YgH0uvXCoc4DWzRTHl8azt2_bc_1DKb8PvHBf1QVppp2rNBHGLeQ_D9bxSXSQBLrjDmOadRX_ZIhCA"
});

async function main() {
  const logs = await db.execute("SELECT id, action, details, status, error_message, created_at FROM agent_logs WHERE action LIKE '%oauth%' OR action LIKE '%token%' ORDER BY id DESC LIMIT 5");
  console.log("Recent OAuth logs:", JSON.stringify(logs.rows, null, 2));
}

main().catch(e => console.error(e));
