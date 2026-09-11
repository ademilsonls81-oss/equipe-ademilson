const http = require('http');

const BASE = 'http://localhost:3000';
const ADMIN_AUTH = 'Basic ' + Buffer.from('admin:admin123').toString('base64');

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function isSuccess(res) {
  if (res.status !== 200) return false;
  if (typeof res.data === 'object' && res.data !== null) {
    return res.data.ok === true || res.data.success === true || Array.isArray(res.data) || res.data.totalSessions !== undefined || res.data.current !== undefined || res.data.google !== undefined;
  }
  return false;
}

async function runTests() {
  const results = [];
  
  console.log('🧪 TESTE E2E - MÁQUINA DE AQUISIÇÃO\n');
  console.log('=' .repeat(60));

  // TESTE 1: Acesso direto à landing page (pageview)
  console.log('\n1️⃣ TESTE: Pageview sem UTM (acesso direto)');
  try {
    const res = await makeRequest('POST', '/api/pageview', {
      session_id: 'e2e-direct-' + Date.now(),
      landing_page: '/grupo-whatsapp/sao-paulo',
      referrer: '',
    });
    const ok = isSuccess(res);
    results.push({ test: '1. Pageview direto', status: ok ? '✅' : '❌', detail: JSON.stringify(res.data) });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- HTTP ${res.status} -`, JSON.stringify(res.data));
  } catch(e) {
    results.push({ test: '1. Pageview direto', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 2: Pageview com UTM
  console.log('\n2️⃣ TESTE: Pageview com UTM parameters');
  const utmSession = 'e2e-utm-' + Date.now();
  try {
    const res = await makeRequest('POST', '/api/pageview', {
      session_id: utmSession,
      landing_page: '/grupo-whatsapp/rio-de-janeiro',
      referrer: 'https://google.com',
      utm_source: 'test',
      utm_medium: 'test',
      utm_campaign: 'funil-e2e',
      utm_content: 'teste01',
    });
    const ok = isSuccess(res);
    results.push({ test: '2. Pageview com UTM', status: ok ? '✅' : '❌', detail: `session=${utmSession}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- session: ${utmSession}`);
  } catch(e) {
    results.push({ test: '2. Pageview com UTM', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 3: Cadastro com UTM
  console.log('\n3️⃣ TESTE: Cadastro com UTM preservada');
  const regSession = 'e2e-reg-' + Date.now();
  let regUid = '';
  let regCode = '';
  try {
    const res = await makeRequest('POST', '/api/register', {
      name: 'Teste E2E User',
      whatsapp: '(11) 99999-0001',
      city: 'São Paulo',
      state: 'SP',
      age_range: '25-34 anos',
      has_smartphone: 'Sim',
      has_support: 'Sim',
      how_found: 'Pesquisa no Google',
      consented: true,
      session_id: regSession,
      utm_source: 'test',
      utm_medium: 'test',
      utm_campaign: 'funil-e2e',
      utm_content: 'teste01',
    });
    const ok = isSuccess(res);
    regUid = res.data?.uid || '';
    regCode = res.data?.referral_code || '';
    results.push({ test: '3. Cadastro com UTM', status: ok ? '✅' : '❌', detail: `uid=${regUid}, code=${regCode}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- uid: ${regUid}, code: ${regCode}`);
  } catch(e) {
    results.push({ test: '3. Cadastro com UTM', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 4: Clique WhatsApp
  console.log('\n4️⃣ TESTE: Clique WhatsApp');
  try {
    const res = await makeRequest('POST', '/api/pageview', {
      session_id: regSession,
      event: 'whatsapp_click',
    });
    const ok = isSuccess(res);
    results.push({ test: '4. Clique WhatsApp', status: ok ? '✅' : '❌', detail: `session=${regSession}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- session: ${regSession}`);
  } catch(e) {
    results.push({ test: '4. Clique WhatsApp', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 5: Cadastro por indicação
  console.log('\n5️⃣ TESTE: Cadastro por indicação');
  const refSession = 'e2e-ref-' + Date.now();
  let refUid = '';
  try {
    const res = await makeRequest('POST', '/api/register', {
      name: 'Indicado E2E User',
      whatsapp: '(11) 98888-0001',
      city: 'Rio de Janeiro',
      state: 'RJ',
      age_range: '35-44 anos',
      has_smartphone: 'Sim',
      has_support: 'Não',
      how_found: 'Indicação de amigo/familiar',
      consented: true,
      ref: 'JOA186',
      session_id: refSession,
      utm_source: 'indicacao',
      utm_medium: 'referral',
      utm_campaign: 'e2e-referral',
    });
    const ok = isSuccess(res);
    refUid = res.data?.uid || '';
    results.push({ test: '5. Cadastro por indicação', status: ok ? '✅' : '❌', detail: `uid=${refUid}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- uid: ${refUid}`);
  } catch(e) {
    results.push({ test: '5. Cadastro por indicação', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 6: Referral tracking
  console.log('\n6️⃣ TESTE: Referral tracking (compartilhamento)');
  try {
    const visitorSession = 'e2e-visitor-' + Date.now();
    const res = await makeRequest('POST', '/api/referral-tracking', {
      action: 'track',
      referrer_uid: '2KD4JIK2MTTFCWCZ',
      referral_code: 'JOA186',
      link_used: 'https://equipe-ademilson.vercel.app/?ref=JOA186&utm_source=whatsapp',
      utm_source: 'whatsapp',
      utm_medium: 'referral',
      utm_campaign: 'viral_share',
      platform: 'whatsapp',
      share_text: 'Teste E2E - mensagem de compartilhamento',
      visitor_session_id: visitorSession,
    });
    const ok = isSuccess(res);
    results.push({ test: '6. Referral tracking', status: ok ? '✅' : '❌', detail: `visitor=${visitorSession}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- visitor: ${visitorSession}`);
  } catch(e) {
    results.push({ test: '6. Referral tracking', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 7: Conversão de indicação
  console.log('\n7️⃣ TESTE: Conversão de indicação');
  try {
    const res = await makeRequest('POST', '/api/referral-tracking', {
      action: 'convert',
      visitor_session_id: refSession,
      converted_uid: refUid,
    });
    const ok = isSuccess(res);
    results.push({ test: '7. Conversão indicação', status: ok ? '✅' : '❌', detail: JSON.stringify(res.data) });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', '-', JSON.stringify(res.data));
  } catch(e) {
    results.push({ test: '7. Conversão indicação', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 8: API Funil
  console.log('\n8️⃣ TESTE: API Funil');
  try {
    const res = await makeRequest('GET', '/api/funnel', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    results.push({ test: '8. API Funil', status: ok ? '✅' : '❌', detail: `Sessions: ${res.data?.totalSessions}, Registered: ${res.data?.registered}, WA: ${res.data?.clickedWhatsApp}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- Sessions: ${res.data?.totalSessions}, Registered: ${res.data?.registered}, WA: ${res.data?.clickedWhatsApp}`);
  } catch(e) {
    results.push({ test: '8. API Funil', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 9: API Command Center
  console.log('\n9️⃣ TESTE: API Command Center');
  try {
    const res = await makeRequest('GET', '/api/command-center', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    results.push({ test: '9. API Command Center', status: ok ? '✅' : '❌', detail: `Members: ${res.data?.total?.members}, Registrations: ${res.data?.total?.registrations}` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- Members: ${res.data?.total?.members}, Registrations: ${res.data?.total?.registrations}`);
  } catch(e) {
    results.push({ test: '9. API Command Center', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 10: API Alertas
  console.log('\n🔟 TESTE: API Alertas');
  try {
    const res = await makeRequest('GET', '/api/command-center?alerts=true', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    results.push({ test: '10. API Alertas', status: ok ? '✅' : '❌', detail: `${count} alertas` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- ${count} alertas encontrados`);
  } catch(e) {
    results.push({ test: '10. API Alertas', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 11: API Forecast
  console.log('\n1️⃣1️⃣ TESTE: API Forecast');
  try {
    const res = await makeRequest('GET', '/api/command-center?forecast=true', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    results.push({ test: '11. API Forecast', status: ok ? '✅' : '❌', detail: `Current: ${res.data?.current}, Forecast: ${res.data?.forecastDays7}d` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- Current: ${res.data?.current}, Forecast: ${res.data?.forecastDays7} dias`);
  } catch(e) {
    results.push({ test: '11. API Forecast', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 12: API Canais
  console.log('\n1️⃣2️⃣ TESTE: API Canais');
  try {
    const res = await makeRequest('GET', '/api/command-center?channels=true', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    const enabled = Object.values(res.data || {}).filter(v => v === true).length;
    results.push({ test: '12. API Canais', status: ok ? '✅' : '❌', detail: `${enabled} canais ativos` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- ${enabled} canais ativos`);
  } catch(e) {
    results.push({ test: '12. API Canais', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // TESTE 13: API Recomendações
  console.log('\n1️⃣3️⃣ TESTE: API Recomendações');
  try {
    const res = await makeRequest('GET', '/api/command-center?recommendations=true', null, { Authorization: ADMIN_AUTH });
    const ok = isSuccess(res);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    results.push({ test: '13. API Recomendações', status: ok ? '✅' : '❌', detail: `${count} recomendações` });
    console.log(ok ? '✅ FUNCIONANDO' : '❌ FALHOU', `- ${count} recomendações`);
  } catch(e) {
    results.push({ test: '13. API Recomendações', status: '❌', detail: e.message });
    console.log('❌ FALHOU -', e.message);
  }

  // RESUMO
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES\n');
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  
  results.forEach(r => {
    console.log(`${r.status} ${r.test}: ${r.detail}`);
  });
  
  console.log(`\n✅ Passou: ${passed}/${results.length}`);
  console.log(`❌ Falhou: ${failed}/${results.length}`);

  return results;
}

runTests().catch(console.error);
