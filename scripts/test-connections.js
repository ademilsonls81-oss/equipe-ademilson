/**
 * Teste de conexoes via API da Vercel
 *
 * USO:
 *   node scripts/test-connections.js SUA_SENHA
 *
 * NAO expoe tokens, secrets ou credenciais.
 */

const VERCEL_URL = "https://equipe-ademilson.vercel.app";
const password = process.argv[2];

if (!password) {
  console.log("Uso: node scripts/test-connections.js SUA_SENHA");
  console.log("A senha e a variavel ADMIN_PASSWORD configurada na Vercel.");
  process.exit(1);
}

const auth = "Basic " + Buffer.from("admin:" + password).toString("base64");
const headers = { Authorization: auth };

async function api(method, path, body) {
  const opts = { method, headers };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(VERCEL_URL + path, opts);
  return { ok: r.ok, status: r.status, data: await r.json() };
}

async function main() {
  console.log("==========================================================");
  console.log("  TESTE DE CONEXOES — FACEBOOK & INSTAGRAM");
  console.log("  " + new Date().toISOString());
  console.log("==========================================================\n");

  // 1. Auth test
  console.log("1. AUTENTICACAO:");
  const authTest = await api("GET", "/api/social-accounts?status=true");
  if (!authTest.ok) {
    console.log("   ❌ Autenticacao falhou (status " + authTest.status + ")");
    console.log("   Senha incorreta ou ADMIN_PASSWORD nao configurada na Vercel.");
    process.exit(1);
  }
  console.log("   ✅ Autenticacao OK\n");

  // 2. Status
  console.log("2. STATUS DAS CONEXOES:");
  for (const p of authTest.data.platforms) {
    const icon = p.connected ? "✅" : "❌";
    const accounts = p.accounts.map(a => a.account_name).join(", ") || "(nenhuma)";
    console.log("   " + icon + " " + p.platform.padEnd(12) + " connected=" + p.connected + " api=" + p.api_configured + " contas: " + accounts);
  }

  // 3. Accounts
  console.log("\n3. CONTAS:");
  const accountsRes = await api("GET", "/api/social-accounts?accounts=true");
  for (const a of accountsRes.data.accounts) {
    console.log("   [" + a.id + "] " + a.platform.padEnd(12) + " | " + a.account_name + " | id:" + a.account_id + " | " + a.status + " | token:" + (a.has_token ? "SIM" : "NAO"));
  }

  // 4. Test Facebook
  console.log("\n4. TESTE FACEBOOK (test_connection):");
  const fb = accountsRes.data.accounts.find(a => a.platform === "facebook");
  if (fb) {
    const test = await api("POST", "/api/social-accounts", { action: "test_connection", id: fb.id });
    if (test.ok && test.data.ok) {
      console.log("   ✅ Conexao OK — Conta: " + test.data.result.account);
    } else {
      console.log("   ❌ Falha: " + (test.data.error || JSON.stringify(test.data)));
    }
  } else {
    console.log("   ❌ Conta Facebook nao encontrada");
  }

  // 5. Test Instagram
  console.log("\n5. TESTE INSTAGRAM (test_connection):");
  const ig = accountsRes.data.accounts.find(a => a.platform === "instagram");
  if (ig) {
    const test = await api("POST", "/api/social-accounts", { action: "test_connection", id: ig.id });
    if (test.ok && test.data.ok) {
      console.log("   ✅ Conexao OK — Conta: " + test.data.result.account);
    } else {
      console.log("   ❌ Falha: " + (test.data.error || JSON.stringify(test.data)));
    }
  } else {
    console.log("   ❌ Conta Instagram nao encontrada");
  }

  console.log("\n==========================================================");
  console.log("  FIM");
  console.log("==========================================================");
  process.exit(0);
}

main().catch(function(e) { console.error(e); process.exit(1); });
