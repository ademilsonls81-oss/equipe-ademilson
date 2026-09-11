const Database = require('better-sqlite3');
const db = new Database('./data/equipe-ademilson.db');

console.log('=== ESTADO ATUAL DO BANCO ===\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM ' + t.name).get().c;
    console.log(t.name + ': ' + count + ' registros');
  } catch(e) {
    console.log(t.name + ': ERRO - ' + e.message);
  }
});

console.log('\n=== ÚLTIMOS 5 REGISTROS DE CADA TABELA ===\n');

tables.forEach(t => {
  try {
    const rows = db.prepare('SELECT * FROM ' + t.name + ' ORDER BY id DESC LIMIT 2').all();
    if (rows.length > 0) {
      console.log('--- ' + t.name + ' ---');
      rows.forEach(r => {
        const safe = {};
        Object.keys(r).forEach(k => {
          if (k === 'whatsapp' || k === 'ip_address' || k === 'user_agent') {
            safe[k] = r[k] ? '[HIDDEN]' : null;
          } else if (k === 'body' || k === 'share_text') {
            safe[k] = r[k] ? r[k].substring(0, 50) + '...' : null;
          } else {
            safe[k] = r[k];
          }
        });
        console.log(JSON.stringify(safe, null, 2));
      });
      console.log('');
    }
  } catch(e) {}
});

db.close();
