import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILENAME = process.env.DATABASE_PATH || "./data/equipe-ademilson.db";
const dbPath = path.resolve(/* turbopackIgnore: true */ process.cwd(), DB_FILENAME);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      age_range TEXT NOT NULL,
      has_smartphone TEXT NOT NULL,
      has_support TEXT NOT NULL,
      how_found TEXT NOT NULL,
      referral_code TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS referral_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      registration_uid TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_uid) REFERENCES registrations(uid)
    );
    CREATE INDEX IF NOT EXISTS idx_reg_uid ON registrations(uid);
    CREATE INDEX IF NOT EXISTS idx_reg_state ON registrations(state);
    CREATE INDEX IF NOT EXISTS idx_reg_created ON registrations(created_at);
    CREATE INDEX IF NOT EXISTS idx_ref_code ON referral_codes(code);
    CREATE INDEX IF NOT EXISTS idx_reg_refcode ON registrations(referral_code);
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      landing_page TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      registered_uid TEXT,
      clicked_whatsapp INTEGER DEFAULT 0,
      joined_whatsapp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registered_uid) REFERENCES registrations(uid)
    );
    CREATE INDEX IF NOT EXISTS idx_sess_id ON sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_sess_uid ON sessions(registered_uid);
    CREATE TABLE IF NOT EXISTS content_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      theme TEXT,
      keywords TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      url TEXT,
      sessions INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      whatsapp_clicks INTEGER DEFAULT 0,
      whatsapp_joins INTEGER DEFAULT 0,
      referrals INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cp_platform ON content_performance(platform);
    CREATE INDEX IF NOT EXISTS idx_cp_status ON content_performance(status);
    CREATE INDEX IF NOT EXISTS idx_cp_theme ON content_performance(theme);
    CREATE TABLE IF NOT EXISTS agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_type TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_log_agent ON agent_logs(agent_type);
    CREATE INDEX IF NOT EXISTS idx_log_created ON agent_logs(created_at);
    CREATE TABLE IF NOT EXISTS agent_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return _db;
}

export interface Registration {
  id: number; uid: string; name: string; whatsapp: string; city: string;
  state: string; age_range: string; has_smartphone: string; has_support: string;
  how_found: string; referral_code: string | null; utm_source: string | null;
  utm_medium: string | null; utm_campaign: string | null; ip_address: string | null;
  created_at: string;
}
export interface RegWithRefs extends Registration { referrals_count: number; my_referral_code: string | null; }

export function createRegistration(data: Omit<Registration, "id" | "created_at">): Registration {
  const db = getDb();
  db.prepare(`INSERT INTO registrations (uid,name,whatsapp,city,state,age_range,has_smartphone,has_support,how_found,referral_code,utm_source,utm_medium,utm_campaign,ip_address)
    VALUES (@uid,@name,@whatsapp,@city,@state,@age_range,@has_smartphone,@has_support,@how_found,@referral_code,@utm_source,@utm_medium,@utm_campaign,@ip_address)`).run(data);
  return getDb().prepare("SELECT * FROM registrations WHERE uid=?").get(data.uid) as Registration;
}
export function createReferralCode(uid: string, code: string) {
  getDb().prepare("INSERT OR IGNORE INTO referral_codes (code,registration_uid) VALUES (?,?)").run(code, uid);
}
export function getReferralCode(code: string) {
  return getDb().prepare("SELECT * FROM referral_codes WHERE code=?").get(code) as any;
}
export function getAllRegistrations(limit = 200, offset = 0): RegWithRefs[] {
  return getDb().prepare(`
    SELECT r.*, rc.code as my_referral_code,
      (SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code = rc.code) as referrals_count
    FROM registrations r LEFT JOIN referral_codes rc ON rc.registration_uid = r.uid
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset) as RegWithRefs[];
}
export function getCount(): number {
  return (getDb().prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;
}
export function getStats() {
  const db = getDb();
  return {
    total: getCount(),
    by_state: db.prepare("SELECT state, COUNT(*) as count FROM registrations GROUP BY state ORDER BY count DESC").all(),
    by_how_found: db.prepare("SELECT how_found, COUNT(*) as count FROM registrations GROUP BY how_found ORDER BY count DESC").all(),
    recent_week: (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE created_at >= datetime('now','-7 days')").get() as any).c,
  };
}
export function exportCsv(): string {
  const rows = getDb().prepare(`
    SELECT r.id,r.name,r.whatsapp,r.city,r.state,r.age_range,r.has_smartphone,r.has_support,
      r.how_found,r.referral_code as veio_do_codigo,rc.code as meu_codigo,
      (SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code=rc.code) as indicacoes,
      r.utm_source,r.utm_medium,r.utm_campaign,r.created_at
    FROM registrations r LEFT JOIN referral_codes rc ON rc.registration_uid=r.uid ORDER BY r.created_at DESC`).all() as any[];
  if (!rows.length) return "Nenhum cadastro";
  const h = Object.keys(rows[0]).join(",");
  const body = rows.map(r => Object.values(r).map(v => v == null ? "" : `"${String(v).replace(/"/g,'""')}"`).join(","));
  return [h, ...body].join("\n");
}
export function getReferralStats(code: string) {
  const db = getDb();
  const refCode = db.prepare("SELECT * FROM referral_codes WHERE code=?").get(code) as any;
  if (!refCode) return null;

  const registration = db.prepare("SELECT * FROM registrations WHERE uid=?").get(refCode.registration_uid) as Registration;
  if (!registration) return null;

  const referralsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE referral_code=?"
  ).get(code) as any).c;

  return {
    ...registration,
    my_referral_code: code,
    referrals_count: referralsCount,
  };
}

export function getTopReferrers(limit: number = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT rc.code, r.name, r.city, r.state,
      (SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code = rc.code) as referrals_count
    FROM referral_codes rc
    JOIN registrations r ON r.uid = rc.registration_uid
    WHERE rc.code IN (
      SELECT referral_code FROM registrations WHERE referral_code IS NOT NULL
      GROUP BY referral_code
      HAVING COUNT(*) > 0
    )
    ORDER BY referrals_count DESC
    LIMIT ?
  `).all(limit) as { code: string; name: string; city: string; state: string; referrals_count: number }[];
}

export function createSession(data: {
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO sessions (session_id, ip_address, user_agent, referrer, landing_page, utm_source, utm_medium, utm_campaign)
    VALUES (@session_id, @ip_address, @user_agent, @referrer, @landing_page, @utm_source, @utm_medium, @utm_campaign)`).run(data);
}

export function linkSessionToRegistration(sessionId: string, uid: string) {
  const db = getDb();
  db.prepare("UPDATE sessions SET registered_uid = ? WHERE session_id = ?").run(uid, sessionId);
}

export function markSessionClickedWhatsApp(sessionId: string) {
  const db = getDb();
  db.prepare("UPDATE sessions SET clicked_whatsapp = 1 WHERE session_id = ?").run(sessionId);
}

export function markSessionJoinedWhatsApp(sessionId: string) {
  const db = getDb();
  db.prepare("UPDATE sessions SET joined_whatsapp = 1 WHERE session_id = ?").run(sessionId);
}

export function getFunnelStats() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const totalSessions = (db.prepare("SELECT COUNT(*) as c FROM sessions").get() as any).c;
  const sessionsToday = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date(created_at) = ?").get(today) as any).c;
  const registered = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE registered_uid IS NOT NULL").get() as any).c;
  const registeredToday = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE registered_uid IS NOT NULL AND date(created_at) = ?").get(today) as any).c;
  const clickedWhatsApp = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1").get() as any).c;
  const joinedWhatsApp = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE joined_whatsapp = 1").get() as any).c;

  const bySource = db.prepare(
    "SELECT utm_source as source, COUNT(*) as sessions, SUM(CASE WHEN registered_uid IS NOT NULL THEN 1 ELSE 0 END) as registrations FROM sessions WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY sessions DESC"
  ).all() as { source: string; sessions: number; registrations: number }[];

  const byLandingPage = db.prepare(
    "SELECT landing_page, COUNT(*) as sessions, SUM(CASE WHEN registered_uid IS NOT NULL THEN 1 ELSE 0 END) as registrations FROM sessions WHERE landing_page IS NOT NULL GROUP BY landing_page ORDER BY sessions DESC LIMIT 10"
  ).all() as { landing_page: string; sessions: number; registrations: number }[];

  return {
    totalSessions,
    sessionsToday,
    registered,
    registeredToday,
    clickedWhatsApp,
    joinedWhatsApp,
    conversionRate: totalSessions > 0 ? Math.round((registered / totalSessions) * 100) : 0,
    whatsappRate: registered > 0 ? Math.round((clickedWhatsApp / registered) * 100) : 0,
    bySource,
    byLandingPage,
  };
}

export function getAnalytics() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const total = getCount();
  const joinedToday = (db.prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?"
  ).get(today) as any).c;
  const joinedYesterday = (db.prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"
  ).get() as any).c;

  const bySource = db.prepare(
    "SELECT utm_source as source, COUNT(*) as count FROM registrations WHERE utm_source IS NOT NULL AND utm_source != '' GROUP BY utm_source ORDER BY count DESC"
  ).all() as { source: string; count: number }[];

  const byCampaign = db.prepare(
    "SELECT utm_campaign as campaign, COUNT(*) as count FROM registrations WHERE utm_campaign IS NOT NULL AND utm_campaign != '' GROUP BY utm_campaign ORDER BY count DESC"
  ).all() as { campaign: string; count: number }[];

  const byHowFound = db.prepare(
    "SELECT how_found, COUNT(*) as count FROM registrations GROUP BY how_found ORDER BY count DESC"
  ).all() as { how_found: string; count: number }[];

  const last7Days = db.prepare(
    "SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day"
  ).all() as { day: string; count: number }[];

  const referralsToday = (db.prepare(
    `SELECT COUNT(*) as c FROM registrations r
     JOIN referral_codes rc ON r.referral_code = rc.code
     WHERE date(r.created_at) = ?`
  ).get(today) as any).c;

  const referralsTotal = (db.prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE referral_code IS NOT NULL AND referral_code != ''"
  ).get() as any).c;

  return {
    total,
    joinedToday,
    joinedYesterday,
    growth: joinedToday,
    bySource,
    byCampaign,
    byHowFound,
    last7Days,
    referralsToday,
    referralsTotal,
    bestCampaign: byCampaign[0] || null,
    bestSource: bySource[0] || null,
  };
}

export function createContentPerformance(data: {
  content_id: string;
  title: string;
  platform: string;
  content_type: string;
  theme?: string;
  keywords?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  url?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO content_performance (content_id, title, platform, content_type, theme, keywords, utm_source, utm_medium, utm_campaign, url)
    VALUES (@content_id, @title, @platform, @content_type, @theme, @keywords, @utm_source, @utm_medium, @utm_campaign, @url)`).run(data);
}

export function updateContentPerformance(contentId: string, data: {
  sessions?: number;
  registrations?: number;
  whatsapp_clicks?: number;
  whatsapp_joins?: number;
  referrals?: number;
  score?: number;
  status?: string;
}) {
  const db = getDb();
  const sets = Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => `${k} = ${typeof v === "number" ? v : `'${v}'`}`).join(", ");
  if (sets) {
    db.prepare(`UPDATE content_performance SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE content_id = ?`).run(contentId);
  }
}

export function getContentPerformance(filters?: { platform?: string; status?: string; limit?: number }) {
  const db = getDb();
  let query = "SELECT * FROM content_performance WHERE 1=1";
  const params: any[] = [];
  if (filters?.platform) { query += " AND platform = ?"; params.push(filters.platform); }
  if (filters?.status) { query += " AND status = ?"; params.push(filters.status); }
  query += " ORDER BY score DESC";
  if (filters?.limit) { query += ` LIMIT ${filters.limit}`; }
  return db.prepare(query).all(...params) as any[];
}

export function getContentStats() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM content_performance").get() as any).c;
  const active = (db.prepare("SELECT COUNT(*) as c FROM content_performance WHERE status = 'active'").get() as any).c;
  const totalSessions = (db.prepare("SELECT COALESCE(SUM(sessions),0) as c FROM content_performance").get() as any).c;
  const totalRegistrations = (db.prepare("SELECT COALESCE(SUM(registrations),0) as c FROM content_performance").get() as any).c;
  const totalWhatsappClicks = (db.prepare("SELECT COALESCE(SUM(whatsapp_clicks),0) as c FROM content_performance").get() as any).c;
  const totalWhatsappJoins = (db.prepare("SELECT COALESCE(SUM(whatsapp_joins),0) as c FROM content_performance").get() as any).c;

  const byPlatform = db.prepare(
    "SELECT platform, COUNT(*) as count, SUM(sessions) as sessions, SUM(registrations) as registrations, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(whatsapp_joins) as whatsapp_joins, AVG(score) as avg_score FROM content_performance GROUP BY platform ORDER BY avg_score DESC"
  ).all() as any[];

  const byTheme = db.prepare(
    "SELECT theme, COUNT(*) as count, SUM(sessions) as sessions, SUM(registrations) as registrations, AVG(score) as avg_score FROM content_performance WHERE theme IS NOT NULL GROUP BY theme ORDER BY avg_score DESC"
  ).all() as any[];

  const bestContent = db.prepare(
    "SELECT * FROM content_performance ORDER BY score DESC LIMIT 1"
  ).get() as any;

  const worstContent = db.prepare(
    "SELECT * FROM content_performance WHERE sessions > 0 ORDER BY score ASC LIMIT 1"
  ).get() as any;

  return {
    total,
    active,
    totalSessions,
    totalRegistrations,
    totalWhatsappClicks,
    totalWhatsappJoins,
    conversionRate: totalSessions > 0 ? Math.round((totalRegistrations / totalSessions) * 100) : 0,
    whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsappClicks / totalRegistrations) * 100) : 0,
    byPlatform,
    byTheme,
    bestContent,
    worstContent,
  };
}

export function createAgentLog(data: {
  agent_type: string;
  action: string;
  details?: string;
  status?: string;
  error_message?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT INTO agent_logs (agent_type, action, details, status, error_message)
    VALUES (@agent_type, @action, @details, @status, @error_message)`).run({
    ...data,
    status: data.status || "success",
  });
}

export function getAgentLogs(limit = 50) {
  const db = getDb();
  return db.prepare("SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
}

export function getAgentConfig(key: string) {
  const db = getDb();
  const row = db.prepare("SELECT config_value FROM agent_config WHERE config_key = ?").get(key) as any;
  return row?.config_value || null;
}

export function setAgentConfig(key: string, value: string) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO agent_config (config_key, config_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)").run(key, value);
}

export default getDb;