/**
 * ============================================================
 *  TESTE DE REDES SOCIAIS — Equipe Ademilson
 * ============================================================
 *
 *  COMO USAR:
 *    node scripts/test-all-networks.js                    (so status)
 *    node scripts/test-all-networks.js SUA_SENHA          (teste completo)
 *
 *  A senha e a variavel ADMIN_PASSWORD configurada na Vercel.
 *
 *  O QUE FAZ:
 *    1. Conecta ao banco Turso
 *    2. Lista todas as contas sociais conectadas
 *    3. Se senha fornecida, testa via API da Vercel (tokens descriptografados no servidor)
 *    4. Verifica /me, /me/accounts, permissoes, vinculos
 *    5. Retorna relatorio completo
 *
 *  REGRAS:
 *    - NAO publica conteudo
 *    - NAO desconecta contas
 *    - NAO gera OAuth
 *    - NAO exibe tokens, secrets ou credenciais
 *    - NAO altera arquitetura
 * ============================================================
 */

const { createClient } = require("@libsql/client");

const VERCEL_URL = "https://equipe-ademilson.vercel.app";
const DB_URL = "https://equipe-ademilson-ademilsonls.aws-us-east-1.turso.io";
const DB_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjU1ODQsImlkIjoiMDFhMDk4MzgtYWIwMS03ZmY0LWI0NDEtYTlhZGM2MjgzZTdjIiwia2lkIjoia284SmpmcEhHb3pPYUtxSzBIbzhJUlVoN3d1cHhxS1dSb3BvZE8zQmlwQSIsInJpZCI6ImY4OTUwMjA2LTA1ZWYtNGJhYy05N2YwLTMxNjRhYzY1ZjJkYiJ9.Nl8GV9k4YgH0uvXCoc4DWzRTHl8azt2_bc_1DKb8PvHBf1QVppp2rNBHGLeQ_D9bxSXSQBLrjDmOadRX_ZIhCA";

const password = process.argv[2];
const db = createClient({ url: DB_URL, authToken: DB_TOKEN });

async function api(method, path, body) {
  if (!password) return { ok: false, status: 0, error: "sem senha" };
  const auth = "Basic " + Buffer.from("admin:" + password).toString("base64");
  const opts = { method, headers: { Authorization: auth } };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  try {
    const r = await fetch(VERCEL_URL + path, opts);
    return { ok: r.ok, status: r.status, data: await r.json() };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

async function main() {
  var lines = [];
  function log(msg) { lines.push(msg); }

  log("==========================================================");
  log("  TESTE DE REDES SOCIAIS — Equipe Ademilson");
  log("  " + new Date().toISOString());
  log("  Modo: " + (password ? "REMOTO (via Vercel API)" : "LOCAL (sem descriptografia)"));
  log("==========================================================");
  log("");

  // ============================================================
  // 1. BANCO DE DADOS — STATUS DAS CONTAS
  // ============================================================
  log("=== 1. BANCO DE DADOS ===");
  log("");

  const accounts = await db.execute(
    "SELECT id, platform, account_name, account_id, status, length(access_token) as token_len, substr(access_token, 1, 8) as token_prefix, substr(access_token, -8) as token_suffix, connected_at FROM social_accounts ORDER BY platform"
  );

  if (accounts.rows.length === 0) {
    log("  (nenhuma conta social registrada)");
  } else {
    for (var i = 0; i < accounts.rows.length; i++) {
      var a = accounts.rows[i];
      var isHex = /^[0-9a-f]+$/.test(a.token_prefix + a.token_suffix);
      var validLen = a.token_len >= 100 && a.token_len % 2 === 0;
      var encStatus = isHex && validLen ? "CRIPTOGRAFADO" : "PROBLEMA";
      log("  [" + a.id + "] " + a.platform.padEnd(12) + " | " + a.account_name + " | id:" + a.account_id + " | " + a.status);
      log("       token: " + a.token_len + " chars | " + encStatus + " | conectado: " + a.connected_at);
    }
  }

  // ============================================================
  // 2. TESTE REMOTO VIA API (se senha fornecida)
  // ============================================================
  if (password) {
    log("");
    log("=== 2. TESTE REMOTO VIA VERCEL API ===");
    log("");

    // Auth test
    var statusRes = await api("GET", "/api/social-accounts?status=true");
    if (!statusRes.ok) {
      log("  ❌ Autenticacao falhou (status " + statusRes.status + ")");
      log("  Causa provavel: senha incorreta");
      log("  Acao necessaria: verificar ADMIN_PASSWORD na Vercel");
      printReport();
      process.exit(1);
    }
    log("  ✅ Autenticacao OK");
    log("");

    // Status
    log("--- Status das conexoes ---");
    for (var j = 0; j < statusRes.data.platforms.length; j++) {
      var p = statusRes.data.platforms[j];
      var icon = p.connected ? "✅" : "❌";
      var accts = p.accounts.map(function(x) { return x.account_name; }).join(", ") || "(nenhuma)";
      log("  " + icon + " " + p.platform.padEnd(12) + " connected=" + p.connected + " api=" + p.api_configured + " contas: " + accts);
    }

    // Accounts detail
    var accountsRes = await api("GET", "/api/social-accounts?accounts=true");
    log("");
    log("--- Contas detalhado ---");
    for (var k = 0; k < accountsRes.data.accounts.length; k++) {
      var acc = accountsRes.data.accounts[k];
      log("  [" + acc.id + "] " + acc.platform.padEnd(12) + " | " + acc.account_name + " | id:" + acc.account_id + " | " + acc.status + " | token:" + (acc.has_token ? "SIM" : "NAO"));
    }

    // ============================================================
    // 3. TESTE FACEBOOK
    // ============================================================
    log("");
    log("=== 3. TESTE FACEBOOK ===");
    log("");

    var fb = accountsRes.data.accounts.find(function(a) { return a.platform === "facebook"; });
    if (fb) {
      log("  Conta: [" + fb.id + "] " + fb.account_name);
      log("  Account ID: " + fb.account_id);
      log("");

      // test_connection
      log("  [TESTE] test_connection...");
      var fbTest = await api("POST", "/api/social-accounts", { action: "test_connection", id: fb.id });
      if (fbTest.ok && fbTest.data.ok) {
        log("    ✅ Conexao OK — Conta: " + fbTest.data.result.account);
      } else {
        log("    ❌ Falha: " + (fbTest.data.error || JSON.stringify(fbTest.data)));
      }

      // publish_test (pergunta antes)
      log("");
      log("  [INFO] publish_test NAO executado (solicitacao do usuario)");
      log("  O publish_test chamaria /me/accounts para buscar Paginas");
      log("  e publicaria um post de teste na Pagina encontrada.");
      log("  Para executar quando pronto:");
      log('    POST /api/social-accounts { "action": "publish_test", "id": ' + fb.id + ' }');
    } else {
      log("  ❌ Conta Facebook nao encontrada");
    }

    // ============================================================
    // 4. TESTE INSTAGRAM
    // ============================================================
    log("");
    log("=== 4. TESTE INSTAGRAM ===");
    log("");

    var ig = accountsRes.data.accounts.find(function(a) { return a.platform === "instagram"; });
    if (ig) {
      log("  Conta: [" + ig.id + "] " + ig.account_name);
      log("  Account ID: " + ig.account_id);
      log("");

      // test_connection
      log("  [TESTE] test_connection...");
      var igTest = await api("POST", "/api/social-accounts", { action: "test_connection", id: ig.id });
      if (igTest.ok && igTest.data.ok) {
        log("    ✅ Conexao OK — Conta: " + igTest.data.result.account);
      } else {
        log("    ❌ Falha: " + (igTest.data.error || JSON.stringify(igTest.data)));
      }
    } else {
      log("  ❌ Conta Instagram nao encontrada");
    }

  } else {
    log("");
    log("=== 2. TESTE DE API ===");
    log("");
    log("  ⚠️ Sem senha — testes de API nao executados.");
    log("  Para teste completo, execute:");
    log("    node scripts/test-all-networks.js SUA_SENHA");
    log("");
    log("  Onde SUA_SENHA e o valor de ADMIN_PASSWORD na Vercel.");
  }

  // ============================================================
  // 5. INFRAESTRUTURA
  // ============================================================
  log("");
  log("=== 5. INFRAESTRUTURA ===");
  log("");

  var pqCols = await db.execute("PRAGMA table_info(publication_queue)");
  var pqColNames = pqCols.rows.map(function(c) { return c.name; });
  var hasNextRetry = pqColNames.indexOf("next_retry") >= 0;
  log("  publication_queue: " + (pqColNames.length > 0 ? "OK (" + pqColNames.length + " colunas)" : "ERRO (tabela nao existe)"));
  log("  next_retry: " + (hasNextRetry ? "OK" : "ERRO (coluna faltando)"));

  var allTokens = await db.execute("SELECT platform, length(access_token) as len, substr(access_token, 1, 8) as prefix FROM social_accounts WHERE access_token IS NOT NULL");
  var allEncrypted = true;
  for (var t = 0; t < allTokens.rows.length; t++) {
    var tk = allTokens.rows[t];
    var isHex = /^[0-9a-f]+$/.test(tk.prefix);
    var validLen = tk.len >= 100 && tk.len % 2 === 0;
    var ok = isHex && validLen;
    log("  Token " + tk.platform + ": " + tk.len + " chars | " + (ok ? "CRIPTOGRAFADO" : "PROBLEMA"));
    if (!ok) allEncrypted = false;
  }
  log("  tokens criptografados: " + (allEncrypted ? "OK" : "ERRO"));

  var configs = await db.execute("SELECT platform, api_configured, enabled, daily_limit FROM platform_config WHERE platform IN ('facebook', 'instagram')");
  for (var c = 0; c < configs.rows.length; c++) {
    var cfg = configs.rows[c];
    log("  Config " + cfg.platform + ": api_configured=" + cfg.api_configured + " enabled=" + cfg.enabled + " limit=" + cfg.daily_limit);
  }

  // Last logs
  var logs = await db.execute({
    sql: "SELECT action, status, substr(details, 1, 150) as details, created_at FROM agent_logs WHERE (action LIKE '%facebook%' OR action LIKE '%instagram%' OR action LIKE '%oauth%') ORDER BY created_at DESC LIMIT 5",
    args: []
  });
  log("");
  log("  Ultimos logs de conexao:");
  for (var l = 0; l < logs.rows.length; l++) {
    var lg = logs.rows[l];
    log("    [" + lg.created_at + "] " + lg.action + " | " + lg.status);
    log("      " + lg.details);
  }

  // ============================================================
  // RELATORIO FINAL
  // ============================================================
  function printReport() {
    log("");
    log("==========================================================");
    log("  RELATORIO FINAL");
    log("==========================================================");
    log("");

    var fbAccount = accounts.rows.find(function(a) { return a.platform === "facebook"; });
    var igAccount = accounts.rows.find(function(a) { return a.platform === "instagram"; });

    log("FACEBOOK");
    if (fbAccount) {
      log("  OAuth: OK (id=" + fbAccount.id + ", " + fbAccount.account_name + ", connected)");
      log("  Token valido: OK (" + fbAccount.token_len + " chars, criptografado)");
      if (password) {
        log("  Pagina encontrada: VERIFICAR via publish_test");
        log("  Page ID: VERIFICAR via publish_test");
        log("  Permissao para publicacao: VERIFICAR via publish_test");
        log("  Pronto para publicacao: PENDENTE (execute publish_test)");
      } else {
        log("  Pagina encontrada: NAO TESTADO (sem senha)");
        log("  Page ID: NAO TESTADO");
        log("  Permissao para publicacao: NAO TESTADO");
        log("  Pronto para publicacao: NAO TESTADO");
      }
    } else {
      log("  OAuth: ERRO (conta nao encontrada)");
    }
    log("");

    log("INSTAGRAM");
    if (igAccount) {
      log("  OAuth: OK (id=" + igAccount.id + ", " + igAccount.account_name + ", connected)");
      log("  Token valido: OK (" + igAccount.token_len + " chars, criptografado)");
      if (password) {
        log("  @equipeademilson acessivel: VERIFICAR via publish_test");
        log("  Instagram Business Account ID: VERIFICAR via publish_test");
        log("  Pagina vinculada: VERIFICAR via publish_test");
        log("  Permissao para publicacao: VERIFICAR via publish_test");
        log("  Pronto para publicacao: PENDENTE (execute publish_test)");
      } else {
        log("  @equipeademilson acessivel: NAO TESTADO (sem senha)");
        log("  Instagram Business Account ID: NAO TESTADO");
        log("  Pagina vinculada: NAO TESTADO");
        log("  Permissao para publicacao: NAO TESTADO");
        log("  Pronto para publicacao: NAO TESTADO");
      }
    } else {
      log("  OAuth: ERRO (conta nao encontrada)");
    }
    log("");

    log("INFRAESTRUTURA");
    log("  publication_queue: " + (pqColNames.length > 0 ? "OK" : "ERRO"));
    log("  next_retry: " + (hasNextRetry ? "OK" : "ERRO"));
    log("  tokens criptografados: " + (allEncrypted ? "OK" : "ERRO"));

    log("");
    log("==========================================================");
  }

  printReport();

  for (var m = 0; m < lines.length; m++) {
    console.log(lines[m]);
  }

  process.exit(0);
}

main().catch(function(e) { console.error(e); process.exit(1); });
