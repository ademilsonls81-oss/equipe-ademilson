/**
 * open-form.js — Abre o navegador em modo VISÍVEL (headed) na URL informada
 * e preenche um formulário parametrizado.
 *
 * Uso:
 *   node scripts/open-form.js --url "https://exemplo.com/contato" \
 *     --field "input[name=nome]=Maria Silva" \
 *     --field "input[name=email]=maria@email.com" \
 *     --submit "button[type=submit]"
 *
 * Ou usando um arquivo de configuração:
 *   node scripts/open-form.js --config scripts/form-config.example.json
 *
 * Opções:
 *   --url <url>        Página a abrir (obrigatório, a menos que esteja no config)
 *   --field <sel=val>  Campo do formulário (pode repetir)
 *   --wait <selector>  Esperar um elemento antes de preencher
 *   --submit <sel>     Clicar em um botão após preencher
 *   --slow <ms>        Atraso entre ações (deixa visualizar, padrão 100)
 *   --config <arquivo> JSON com { url, waitFor, fields: [{selector, value}], submit, slowMo }
 *   --no-wait          Fechar o navegador ao final em vez de esperar Enter
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseArgs(argv) {
  const args = { fields: [], slow: 100, wait: null, submit: null, config: null, url: null, waitForInput: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--field') args.fields.push(argv[++i]);
    else if (a === '--wait') args.wait = argv[++i];
    else if (a === '--submit') args.submit = argv[++i];
    else if (a === '--slow') args.slow = Number(argv[++i]) || 0;
    else if (a === '--config') args.config = argv[++i];
    else if (a === '--no-wait') args.waitForInput = false;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function splitField(raw) {
  const idx = raw.indexOf('=');
  if (idx === -1) throw new Error(`Campo inválido (esperado seletor=valor): "${raw}"`);
  return { selector: raw.slice(0, idx), value: raw.slice(idx + 1) };
}

function waitEnter() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\nPressione ENTER para fechar o navegador...\n', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace('/**', ''));
    return;
  }

  let cfg = { url: args.url, waitFor: args.wait, fields: args.fields.map(splitField), submit: args.submit, slowMo: args.slow };
  if (args.config) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(args.config), 'utf8'));
    cfg = {
      url: raw.url || cfg.url,
      waitFor: raw.waitFor || cfg.waitFor,
      fields: (raw.fields || []).concat(cfg.fields),
      submit: raw.submit || cfg.submit,
      slowMo: Number.isFinite(raw.slowMo) ? raw.slowMo : cfg.slowMo,
    };
  }

  if (!cfg.url) {
    console.error('❌ Informe a URL com --url ou --config <arquivo>.');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('❌ Playwright não está instalado. Rode:');
    console.error('   npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  console.log(`🚀 Abrindo navegador visível em: ${cfg.url}`);
  const browser = await chromium.launch({ headless: false, slowMo: cfg.slowMo });
  const page = await browser.newPage({ viewport: null });

  try {
    await page.goto(cfg.url, { waitUntil: 'domcontentloaded' });

    if (cfg.waitFor) {
      console.log(`⏳ Esperando elemento: ${cfg.waitFor}`);
      await page.waitForSelector(cfg.waitFor, { timeout: 15000 });
    }

    for (const { selector, value } of cfg.fields) {
      await page.waitForSelector(selector, { timeout: 15000 });
      await page.fill(selector, value);
      console.log(`✏️  Preenchido ${selector}`);
    }

    if (cfg.submit) {
      console.log(`🖱️  Clicando em: ${cfg.submit}`);
      await page.click(cfg.submit);
    }

    console.log('✅ Formulário preenchido.');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (args.waitForInput) await waitEnter();
    await browser.close();
    process.exit(1);
  }

  if (args.waitForInput) await waitEnter();
  await browser.close();
  console.log('👋 Navegador fechado.');
}

main();
