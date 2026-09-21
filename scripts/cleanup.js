const { createClient } = require('@libsql/client');
const cl = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_DB_TOKEN });
(async () => {
  const r = await cl.execute("DELETE FROM social_accounts WHERE platform = 'facebook'");
  console.log('Deleted:', r.rowsAffected);
  const r2 = await cl.execute('SELECT id, platform, account_name, status FROM social_accounts');
  console.log(JSON.stringify(r2.rows, null, 2));
  process.exit(0);
})();
