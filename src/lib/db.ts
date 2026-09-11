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
      body TEXT,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      theme TEXT,
      keywords TEXT,
      utm_source TEXT,
      utm_medium TEXT DEFAULT 'social',
      utm_campaign TEXT,
      url TEXT,
      share_url TEXT,
      sessions INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      whatsapp_clicks INTEGER DEFAULT 0,
      whatsapp_joins INTEGER DEFAULT 0,
      referrals INTEGER DEFAULT 0,
      ctr REAL DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      score REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      published_at DATETIME,
      result TEXT,
      approved INTEGER DEFAULT 0,
      approved_by TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cp_platform ON content_performance(platform);
    CREATE INDEX IF NOT EXISTS idx_cp_status ON content_performance(status);
    CREATE INDEX IF NOT EXISTS idx_cp_theme ON content_performance(theme);
    CREATE TABLE IF NOT EXISTS content_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id TEXT UNIQUE NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      last_error TEXT,
      next_retry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_cq_status ON content_queue(status);
    CREATE INDEX IF NOT EXISTS idx_cq_action ON content_queue(action);
    CREATE TABLE IF NOT EXISTS acquisition_score (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      platform TEXT,
      campaign TEXT,
      theme TEXT,
      content_id TEXT,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      whatsapp_clicks INTEGER DEFAULT 0,
      referrals INTEGER DEFAULT 0,
      ctr REAL DEFAULT 0,
      registration_rate REAL DEFAULT 0,
      whatsapp_rate REAL DEFAULT 0,
      referral_rate REAL DEFAULT 0,
      members_per_content REAL DEFAULT 0,
      score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_as_date ON acquisition_score(date);
    CREATE INDEX IF NOT EXISTS idx_as_platform ON acquisition_score(platform);
    CREATE TABLE IF NOT EXISTS content_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      relevance INTEGER DEFAULT 50,
      traffic_potential INTEGER DEFAULT 50,
      conversion_potential INTEGER DEFAULT 50,
      priority INTEGER DEFAULT 50,
      status TEXT DEFAULT 'active',
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ct_category ON content_topics(category);
    CREATE INDEX IF NOT EXISTS idx_ct_status ON content_topics(status);
    CREATE INDEX IF NOT EXISTS idx_ct_priority ON content_topics(priority);
    CREATE TABLE IF NOT EXISTS content_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id TEXT UNIQUE NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      body TEXT,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      cta TEXT,
      destination_url TEXT,
      utm_source TEXT,
      utm_medium TEXT DEFAULT 'social',
      utm_campaign TEXT,
      utm_content TEXT,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'ideia',
      scheduled_at DATETIME,
      published_at DATETIME,
      result TEXT,
      score REAL DEFAULT 0,
      sessions INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      whatsapp_clicks INTEGER DEFAULT 0,
      referrals INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cd_platform ON content_drafts(platform);
    CREATE INDEX IF NOT EXISTS idx_cd_status ON content_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_cd_topic ON content_drafts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_cd_utm ON content_drafts(utm_campaign);
    CREATE TABLE IF NOT EXISTS content_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id TEXT UNIQUE NOT NULL,
      draft_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      scheduled_for DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      published_at DATETIME,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cs_platform ON content_schedule(platform);
    CREATE INDEX IF NOT EXISTS idx_cs_status ON content_schedule(status);
    CREATE TABLE IF NOT EXISTS agent_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      daily_limit INTEGER DEFAULT 5,
      current_count INTEGER DEFAULT 0,
      last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform)
    );
    CREATE TABLE IF NOT EXISTS referral_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_uid TEXT NOT NULL,
      referral_code TEXT NOT NULL,
      link_used TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      platform TEXT,
      share_text TEXT,
      ab_test_id TEXT,
      visitor_session_id TEXT,
      converted INTEGER DEFAULT 0,
      converted_uid TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_uid) REFERENCES registrations(uid)
    );
    CREATE INDEX IF NOT EXISTS idx_rt_referrer ON referral_tracking(referrer_uid);
    CREATE INDEX IF NOT EXISTS idx_rt_code ON referral_tracking(referral_code);
    CREATE INDEX IF NOT EXISTS idx_rt_ab ON referral_tracking(ab_test_id);
    CREATE TABLE IF NOT EXISTS ab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT UNIQUE NOT NULL,
      test_name TEXT NOT NULL,
      test_type TEXT NOT NULL,
      variant_a TEXT NOT NULL,
      variant_b TEXT NOT NULL,
      metric TEXT DEFAULT 'conversion',
      status TEXT DEFAULT 'active',
      winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_ab_test ON ab_tests(test_id);
    CREATE TABLE IF NOT EXISTS ab_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      variant TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(test_id, session_id)
    );
    CREATE INDEX IF NOT EXISTS idx_aba_test ON ab_assignments(test_id);
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
    CREATE TABLE IF NOT EXISTS campaign_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id TEXT NOT NULL,
      content_index INTEGER NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      cta TEXT,
      url TEXT,
      utm_source TEXT,
      utm_medium TEXT DEFAULT 'organic',
      utm_campaign TEXT,
      utm_content TEXT,
      status TEXT DEFAULT 'pronto',
      sessions INTEGER DEFAULT 0,
      registrations INTEGER DEFAULT 0,
      whatsapp_clicks INTEGER DEFAULT 0,
      referrals INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cc_campaign ON campaign_contents(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_cc_platform ON campaign_contents(platform);
    CREATE INDEX IF NOT EXISTS idx_cc_status ON campaign_contents(status);
    CREATE INDEX IF NOT EXISTS idx_cc_content ON campaign_contents(content_index);
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
    VALUES (@session_id, @ip_address, @user_agent, @referrer, @landing_page, @utm_source, @utm_medium, @utm_campaign)`).run({
    ...data,
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
    referrer: data.referrer || null,
    landing_page: data.landing_page || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
  });
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
    details: data.details || null,
    status: data.status || "success",
    error_message: data.error_message || null,
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

export function createReferralTracking(data: {
  referrer_uid: string;
  referral_code: string;
  link_used?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  platform?: string;
  share_text?: string;
  ab_test_id?: string;
  visitor_session_id?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT INTO referral_tracking (referrer_uid, referral_code, link_used, utm_source, utm_medium, utm_campaign, platform, share_text, ab_test_id, visitor_session_id)
    VALUES (@referrer_uid, @referral_code, @link_used, @utm_source, @utm_medium, @utm_campaign, @platform, @share_text, @ab_test_id, @visitor_session_id)`).run(data);
}

export function markReferralConverted(visitorSessionId: string, convertedUid: string) {
  const db = getDb();
  db.prepare("UPDATE referral_tracking SET converted = 1, converted_uid = ? WHERE visitor_session_id = ? AND converted = 0").run(convertedUid, visitorSessionId);
}

export function getReferralStatsAdvanced() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const totalReferrals = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking").get() as any).c;
  const convertedReferrals = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking WHERE converted = 1").get() as any).c;
  const referralsToday = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking WHERE date(created_at) = ?").get(today) as any).c;
  const convertedToday = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking WHERE converted = 1 AND date(created_at) = ?").get(today) as any).c;

  const byPlatform = db.prepare(
    "SELECT platform, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE platform IS NOT NULL GROUP BY platform ORDER BY total DESC"
  ).all() as { platform: string; total: number; converted: number }[];

  const bySource = db.prepare(
    "SELECT utm_source as source, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY total DESC"
  ).all() as { source: string; total: number; converted: number }[];

  const topReferrers = db.prepare(`
    SELECT rt.referrer_uid, r.name, r.city, r.state, COUNT(*) as total_referrals,
      SUM(CASE WHEN rt.converted = 1 THEN 1 ELSE 0 END) as conversions
    FROM referral_tracking rt
    JOIN registrations r ON r.uid = rt.referrer_uid
    GROUP BY rt.referrer_uid
    ORDER BY conversions DESC
    LIMIT 10
  `).all() as { referrer_uid: string; name: string; city: string; state: string; total_referrals: number; conversions: number }[];

  const byDay = db.prepare(
    "SELECT date(created_at) as day, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day"
  ).all() as { day: string; total: number; converted: number }[];

  const growthCoefficient = totalReferrals > 0 ? (convertedReferrals / totalReferrals) : 0;

  return {
    totalReferrals,
    convertedReferrals,
    referralsToday,
    convertedToday,
    conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0,
    growthCoefficient: Math.round(growthCoefficient * 100) / 100,
    byPlatform,
    bySource,
    topReferrers,
    byDay,
  };
}

export function createABTest(data: {
  test_id: string;
  test_name: string;
  test_type: string;
  variant_a: string;
  variant_b: string;
  metric?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO ab_tests (test_id, test_name, test_type, variant_a, variant_b, metric)
    VALUES (@test_id, @test_name, @test_type, @variant_a, @variant_b, @metric)`).run({
    ...data,
    metric: data.metric || "conversion",
  });
}

export function assignABVariant(testId: string, sessionId: string): string {
  const db = getDb();
  const existing = db.prepare("SELECT variant FROM ab_assignments WHERE test_id = ? AND session_id = ?").get(testId, sessionId) as any;
  if (existing) return existing.variant;

  const variant = Math.random() < 0.5 ? "A" : "B";
  db.prepare("INSERT OR IGNORE INTO ab_assignments (test_id, session_id, variant) VALUES (?, ?, ?)").run(testId, sessionId, variant);
  return variant;
}

export function recordABConversion(testId: string, sessionId: string) {
  const db = getDb();
  const assignment = db.prepare("SELECT variant FROM ab_assignments WHERE test_id = ? AND session_id = ?").get(testId, sessionId) as any;
  if (!assignment) return;

  const test = db.prepare("SELECT * FROM ab_tests WHERE test_id = ?").get(testId) as any;
  if (!test) return;

  const variantAConversions = (db.prepare(
    "SELECT COUNT(*) as c FROM ab_assignments aa WHERE aa.test_id = ? AND aa.variant = 'A' AND aa.session_id IN (SELECT visitor_session_id FROM referral_tracking WHERE converted = 1)"
  ).get(testId) as any).c;

  const variantBConversions = (db.prepare(
    "SELECT COUNT(*) as c FROM ab_assignments aa WHERE aa.test_id = ? AND aa.variant = 'B' AND aa.session_id IN (SELECT visitor_session_id FROM referral_tracking WHERE converted = 1)"
  ).get(testId) as any).c;

  const variantATotal = (db.prepare(
    "SELECT COUNT(*) as c FROM ab_assignments WHERE test_id = ? AND variant = 'A'"
  ).get(testId) as any).c;

  const variantBTotal = (db.prepare(
    "SELECT COUNT(*) as c FROM ab_assignments WHERE test_id = ? AND variant = 'B'"
  ).get(testId) as any).c;

  const rateA = variantATotal > 0 ? variantAConversions / variantATotal : 0;
  const rateB = variantBTotal > 0 ? variantBConversions / variantBTotal : 0;

  let winner = null;
  if (variantATotal >= 10 && variantBTotal >= 10) {
    if (rateA > rateB * 1.1) winner = "A";
    else if (rateB > rateA * 1.1) winner = "B";
  }

  if (winner) {
    db.prepare("UPDATE ab_tests SET winner = ?, ended_at = CURRENT_TIMESTAMP WHERE test_id = ? AND winner IS NULL").run(winner, testId);
  }

  return { variantA: { conversions: variantAConversions, total: variantATotal, rate: rateA }, variantB: { conversions: variantBConversions, total: variantBTotal, rate: rateB }, winner };
}

export function getABTests() {
  const db = getDb();
  return db.prepare("SELECT * FROM ab_tests ORDER BY created_at DESC").all() as any[];
}

export function getABTestResults(testId: string) {
  const db = getDb();
  const test = db.prepare("SELECT * FROM ab_tests WHERE test_id = ?").get(testId) as any;
  if (!test) return null;

  const variantA = db.prepare(
    "SELECT COUNT(*) as total FROM ab_assignments WHERE test_id = ? AND variant = 'A'"
  ).get(testId) as any;

  const variantB = db.prepare(
    "SELECT COUNT(*) as total FROM ab_assignments WHERE test_id = ? AND variant = 'B'"
  ).get(testId) as any;

  return { ...test, variantA: variantA.total, variantB: variantB.total };
}

export function getGrowthMetrics() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const totalMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;
  const membersToday = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?").get(today) as any).c;
  const membersYesterday = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')").get() as any).c;

  const referralMembers = (db.prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE referral_code IS NOT NULL AND referral_code != ''"
  ).get() as any).c;

  const directMembers = totalMembers - referralMembers;

  const last7Days = db.prepare(
    "SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day"
  ).all() as { day: string; count: number }[];

  const last30Days = db.prepare(
    "SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day"
  ).all() as { day: string; count: number }[];

  const growthRate = membersYesterday > 0 ? ((membersToday - membersYesterday) / membersYesterday * 100) : 0;
  const viralCoefficient = totalMembers > 0 ? (referralMembers / totalMembers) : 0;

  return {
    totalMembers,
    membersToday,
    membersYesterday,
    referralMembers,
    directMembers,
    growthRate: Math.round(growthRate * 10) / 10,
    viralCoefficient: Math.round(viralCoefficient * 100) / 100,
    last7Days,
    last30Days,
  };
}

export function getCommandCenterData() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const GOAL = 1000;

  const visitorsToday = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE date(created_at) = ?").get(today) as any).c;
  const registrationsToday = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?").get(today) as any).c;
  const whatsappClicksToday = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1 AND date(created_at) = ?").get(today) as any).c;
  const newMembersToday = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?").get(today) as any).c;
  const newReferralsToday = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking WHERE date(created_at) = ?").get(today) as any).c;

  const totalVisitors = (db.prepare("SELECT COUNT(*) as c FROM sessions").get() as any).c;
  const totalRegistrations = (db.prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;
  const totalWhatsappClicks = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1").get() as any).c;
  const totalMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;
  const totalReferrals = (db.prepare("SELECT COUNT(*) as c FROM referral_tracking").get() as any).c;

  const funnel = {
    visitors: totalVisitors,
    registrations: totalRegistrations,
    whatsappClicks: totalWhatsappClicks,
    members: totalMembers,
    referrals: totalReferrals,
    registrationRate: totalVisitors > 0 ? Math.round((totalRegistrations / totalVisitors) * 100) : 0,
    whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsappClicks / totalRegistrations) * 100) : 0,
    memberRate: totalWhatsappClicks > 0 ? Math.round((totalMembers / totalWhatsappClicks) * 100) : 0,
    referralRate: totalMembers > 0 ? Math.round((totalReferrals / totalMembers) * 100) : 0,
  };

  const byOrigin = db.prepare(`
    SELECT 
      COALESCE(utm_source, 'direct') as origin,
      COUNT(*) as count,
      SUM(CASE WHEN clicked_whatsapp = 1 THEN 1 ELSE 0 END) as whatsapp_clicks
    FROM sessions 
    GROUP BY origin 
    ORDER BY count DESC
  `).all() as { origin: string; count: number; whatsapp_clicks: number }[];

  const byCity = db.prepare(`
    SELECT city, state, COUNT(*) as count 
    FROM registrations 
    GROUP BY city, state 
    ORDER BY count DESC 
    LIMIT 10
  `).all() as { city: string; state: string; count: number }[];

  const bestContent = db.prepare(`
    SELECT title, score, registrations, whatsapp_clicks 
    FROM content_performance 
    ORDER BY registrations DESC 
    LIMIT 1
  `).get() as any;

  const bestCampaign = db.prepare(`
    SELECT utm_campaign as campaign, COUNT(*) as count 
    FROM registrations 
    WHERE utm_campaign IS NOT NULL AND utm_campaign != ''
    GROUP BY utm_campaign 
    ORDER BY count DESC 
    LIMIT 1
  `).get() as any;

  const bestPlatform = db.prepare(`
    SELECT platform, COUNT(*) as count 
    FROM content_performance 
    GROUP BY platform 
    ORDER BY count DESC 
    LIMIT 1
  `).get() as any;

  const bestCity = byCity[0] || null;

  const bestCTA = db.prepare(`
    SELECT share_text as cta, COUNT(*) as count 
    FROM referral_tracking 
    WHERE share_text IS NOT NULL 
    GROUP BY share_text 
    ORDER BY count DESC 
    LIMIT 1
  `).get() as any;

  const contentGenerated = (db.prepare("SELECT COUNT(*) as c FROM content_performance").get() as any).c;
  const contentPublished = (db.prepare("SELECT COUNT(*) as c FROM content_performance WHERE status = 'published'").get() as any).c;
  const contentPending = (db.prepare("SELECT COUNT(*) as c FROM content_performance WHERE status = 'pending'").get() as any).c;
  const contentErrors = (db.prepare("SELECT COUNT(*) as c FROM content_performance WHERE status = 'error'").get() as any).c;
  const nextExecution = getAgentConfig("next_execution") || "Não agendado";

  const progress = Math.round((totalMembers / GOAL) * 100);
  const remaining = Math.max(0, GOAL - totalMembers);

  return {
    today: {
      visitors: visitorsToday,
      registrations: registrationsToday,
      whatsappClicks: whatsappClicksToday,
      newMembers: newMembersToday,
      newReferrals: newReferralsToday,
    },
    total: {
      visitors: totalVisitors,
      registrations: totalRegistrations,
      whatsappClicks: totalWhatsappClicks,
      members: totalMembers,
      referrals: totalReferrals,
    },
    funnel,
    byOrigin,
    byCity,
    champions: {
      bestContent: bestContent ? { title: bestContent.title, score: bestContent.score, registrations: bestContent.registrations } : null,
      bestCampaign: bestCampaign ? { campaign: bestCampaign.campaign, count: bestCampaign.count } : null,
      bestPlatform: bestPlatform ? { platform: bestPlatform.platform, count: bestPlatform.count } : null,
      bestCity: bestCity ? { city: bestCity.city, state: bestCity.state, count: bestCity.count } : null,
      bestCTA: bestCTA ? { cta: bestCTA.cta, count: bestCTA.count } : null,
    },
    agent: {
      generated: contentGenerated,
      published: contentPublished,
      pending: contentPending,
      errors: contentErrors,
      nextExecution,
    },
    goal: {
      target: GOAL,
      current: totalMembers,
      remaining,
      progress,
    },
  };
}

export function getAlerts() {
  const db = getDb();
  const alerts: { type: string; severity: string; message: string; timestamp: string }[] = [];

  const highConversionCampaign = db.prepare(`
    SELECT utm_campaign, COUNT(*) as count 
    FROM registrations 
    WHERE date(created_at) = date('now') AND utm_campaign IS NOT NULL
    GROUP BY utm_campaign 
    HAVING count > 10
  `).all() as { utm_campaign: string; count: number }[];

  highConversionCampaign.forEach(c => {
    alerts.push({
      type: "high_conversion",
      severity: "success",
      message: `Campanha "${c.utm_campaign}" converteu ${c.count} membros hoje!`,
      timestamp: new Date().toISOString(),
    });
  });

  const highTrafficPage = db.prepare(`
    SELECT landing_page, COUNT(*) as count 
    FROM sessions 
    WHERE date(created_at) = date('now')
    GROUP BY landing_page 
    HAVING count > 50
  `).all() as { landing_page: string; count: number }[];

  highTrafficPage.forEach(p => {
    alerts.push({
      type: "high_traffic",
      severity: "info",
      message: `Página "${p.landing_page}" recebeu ${p.count} visitantes hoje!`,
      timestamp: new Date().toISOString(),
    });
  });

  const contentPerformance = db.prepare(`
    SELECT title, whatsapp_clicks 
    FROM content_performance 
    WHERE date(created_at) = date('now') AND whatsapp_clicks > 5
  `).all() as { title: string; whatsapp_clicks: number }[];

  contentPerformance.forEach(c => {
    alerts.push({
      type: "content_performance",
      severity: "success",
      message: `Conteúdo "${c.title}" gerou ${c.whatsapp_clicks} cliques no WhatsApp!`,
      timestamp: new Date().toISOString(),
    });
  });

  const agentErrors = db.prepare(`
    SELECT action, error_message 
    FROM agent_logs 
    WHERE status = 'error' AND date(created_at) = date('now')
    LIMIT 5
  `).all() as { action: string; error_message: string }[];

  agentErrors.forEach(e => {
    alerts.push({
      type: "agent_error",
      severity: "error",
      message: `Erro no agente: ${e.action} - ${e.error_message}`,
      timestamp: new Date().toISOString(),
    });
  });

  const yesterdayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')").get() as any).c;
  const todayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')").get() as any).c;
  if (yesterdayMembers > 0 && todayMembers < yesterdayMembers * 0.5) {
    alerts.push({
      type: "conversion_drop",
      severity: "warning",
      message: `Queda de conversão: ${todayMembers} membros hoje vs ${yesterdayMembers} ontem`,
      timestamp: new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder: Record<string, number> = { error: 0, warning: 1, success: 2, info: 3 };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });
}

export function getChannelStatus() {
  const db = getDb();
  return {
    google: getAgentConfig("channel_google") !== "false",
    youtube: getAgentConfig("channel_youtube") !== "false",
    tiktok: getAgentConfig("channel_tiktok") !== "false",
    facebook: getAgentConfig("channel_facebook") !== "false",
    instagram: getAgentConfig("channel_instagram") !== "false",
    pinterest: getAgentConfig("channel_pinterest") !== "false",
    reddit: getAgentConfig("channel_reddit") !== "false",
    whatsapp: getAgentConfig("channel_whatsapp") !== "false",
    indicacao: getAgentConfig("channel_indicacao") !== "false",
    direto: getAgentConfig("channel_direto") !== "false",
    outros: getAgentConfig("channel_outros") !== "false",
  };
}

export function toggleChannel(channel: string, enabled: boolean) {
  const db = getDb();
  setAgentConfig(`channel_${channel}`, enabled ? "true" : "false");
}

export function addToContentQueue(data: {
  content_id: string;
  action: string;
  payload: string;
}) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO content_queue (content_id, action, payload) VALUES (?, ?, ?)`).run(data.content_id, data.action, data.payload);
}

export function processContentQueue(limit: number = 10) {
  const db = getDb();
  const items = db.prepare(`SELECT * FROM content_queue WHERE status = 'pending' AND (next_retry IS NULL OR next_retry <= datetime('now')) ORDER BY created_at ASC LIMIT ?`).all(limit) as any[];
  return items;
}

export function markQueueItemProcessed(contentId: string, status: string, error?: string) {
  const db = getDb();
  if (status === "error") {
    db.prepare(`UPDATE content_queue SET status = 'error', last_error = ?, attempts = attempts + 1, next_retry = datetime('now', '+1 hour'), processed_at = CURRENT_TIMESTAMP WHERE content_id = ?`).run(error, contentId);
  } else {
    db.prepare(`UPDATE content_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE content_id = ?`).run(status, contentId);
  }
}

export function getContentQueueStats() {
  const db = getDb();
  const pending = (db.prepare("SELECT COUNT(*) as c FROM content_queue WHERE status = 'pending'").get() as any).c;
  const processing = (db.prepare("SELECT COUNT(*) as c FROM content_queue WHERE status = 'processing'").get() as any).c;
  const completed = (db.prepare("SELECT COUNT(*) as c FROM content_queue WHERE status = 'completed'").get() as any).c;
  const failed = (db.prepare("SELECT COUNT(*) as c FROM content_queue WHERE status = 'error'").get() as any).c;
  return { pending, processing, completed, failed };
}

export function calculateAcquisitionScore() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const platforms = db.prepare(`SELECT platform, COUNT(*) as content_count, SUM(sessions) as total_sessions, SUM(registrations) as total_registrations, SUM(whatsapp_clicks) as total_whatsapp, SUM(referrals) as total_referrals FROM content_performance WHERE status = 'published' GROUP BY platform`).all() as any[];

  platforms.forEach(p => {
    const ctr = p.total_sessions > 0 ? (p.total_whatsapp / p.total_sessions) : 0;
    const registrationRate = p.total_sessions > 0 ? (p.total_registrations / p.total_sessions) : 0;
    const whatsappRate = p.total_registrations > 0 ? (p.total_whatsapp / p.total_registrations) : 0;
    const referralRate = p.total_registrations > 0 ? (p.total_referrals / p.total_registrations) : 0;
    const membersPerContent = p.content_count > 0 ? (p.total_registrations / p.content_count) : 0;
    const score = (registrationRate * 40) + (whatsappRate * 30) + (referralRate * 20) + (membersPerContent * 10);

    db.prepare(`INSERT OR REPLACE INTO acquisition_score (date, platform, impressions, clicks, registrations, whatsapp_clicks, referrals, ctr, registration_rate, whatsapp_rate, referral_rate, members_per_content, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      today, p.platform, p.total_sessions, p.total_whatsapp, p.total_registrations, p.total_whatsapp, p.total_referrals,
      Math.round(ctr * 100) / 100, Math.round(registrationRate * 100) / 100, Math.round(whatsappRate * 100) / 100, Math.round(referralRate * 100) / 100,
      Math.round(membersPerContent * 10) / 10, Math.round(score * 10) / 10
    );
  });

  const campaigns = db.prepare(`SELECT utm_campaign, COUNT(*) as content_count, SUM(sessions) as total_sessions, SUM(registrations) as total_registrations, SUM(whatsapp_clicks) as total_whatsapp, SUM(referrals) as total_referrals FROM content_performance WHERE status = 'published' AND utm_campaign IS NOT NULL GROUP BY utm_campaign`).all() as any[];

  campaigns.forEach(c => {
    const score = c.total_sessions > 0 ? ((c.total_registrations / c.total_sessions) * 100) : 0;
    db.prepare(`INSERT OR REPLACE INTO acquisition_score (date, campaign, impressions, clicks, registrations, whatsapp_clicks, referrals, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      today, c.utm_campaign, c.total_sessions, c.total_whatsapp, c.total_registrations, c.total_whatsapp, c.total_referrals, Math.round(score * 10) / 10
    );
  });

  return { platforms: platforms.length, campaigns: campaigns.length };
}

export function getAcquisitionScore() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const byPlatform = db.prepare(`SELECT * FROM acquisition_score WHERE date = ? AND platform IS NOT NULL ORDER BY score DESC`).all(today) as any[];
  const byCampaign = db.prepare(`SELECT * FROM acquisition_score WHERE date = ? AND campaign IS NOT NULL ORDER BY score DESC`).all(today) as any[];

  const bestPlatform = byPlatform[0] || null;
  const bestCampaign = byCampaign[0] || null;

  return { byPlatform, byCampaign, bestPlatform, bestCampaign };
}

export function getAgentRecommendations() {
  const db = getDb();
  const recommendations: { type: string; priority: string; action: string; reason: string; data: any }[] = [];

  const bestThemes = db.prepare(`SELECT theme, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' AND theme IS NOT NULL GROUP BY theme HAVING count >= 2 ORDER BY avg_score DESC LIMIT 3`).all() as any[];
  bestThemes.forEach(t => {
    recommendations.push({ type: "repeat_theme", priority: "high", action: `Repetir tema "${t.theme}"`, reason: `Score médio: ${t.avg_score.toFixed(1)} (${t.count} conteúdos)`, data: t });
  });

  const badThemes = db.prepare(`SELECT theme, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' AND theme IS NOT NULL GROUP BY theme HAVING count >= 2 AND avg_score < 20 ORDER BY avg_score ASC LIMIT 3`).all() as any[];
  badThemes.forEach(t => {
    recommendations.push({ type: "abandon_theme", priority: "low", action: `Abandonar tema "${t.theme}"`, reason: `Score médio baixo: ${t.avg_score.toFixed(1)}`, data: t });
  });

  const bestPlatforms = db.prepare(`SELECT platform, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' GROUP BY platform ORDER BY avg_score DESC LIMIT 3`).all() as any[];
  bestPlatforms.forEach(p => {
    recommendations.push({ type: "focus_platform", priority: "high", action: `Focar na plataforma "${p.platform}"`, reason: `Score médio: ${p.avg_score.toFixed(1)}`, data: p });
  });

  const bestCTAs = db.prepare(`SELECT share_text, COUNT(*) as count FROM referral_tracking WHERE share_text IS NOT NULL GROUP BY share_text ORDER BY count DESC LIMIT 3`).all() as any[];
  bestCTAs.forEach(c => {
    recommendations.push({ type: "use_cta", priority: "medium", action: `Usar CTA: "${c.share_text.substring(0, 50)}..."`, reason: `${c.count} usos`, data: c });
  });

  return recommendations;
}

export function getGoalForecast() {
  const db = getDb();
  const GOAL = 1000;
  const totalMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;

  const last30 = db.prepare(`SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day`).all() as { day: string; count: number }[];

  const last7 = db.prepare(`SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day`).all() as { day: string; count: number }[];

  const avgDaily30 = last30.length > 0 ? last30.reduce((s, d) => s + d.count, 0) / last30.length : 0;
  const avgDaily7 = last7.length > 0 ? last7.reduce((s, d) => s + d.count, 0) / last7.length : 0;

  const todayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')").get() as any).c;
  const yesterdayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')").get() as any).c;
  const dailyGrowth = yesterdayMembers > 0 ? ((todayMembers - yesterdayMembers) / yesterdayMembers * 100) : 0;

  const remaining = Math.max(0, GOAL - totalMembers);
  const forecastDays30 = avgDaily30 > 0 ? Math.ceil(remaining / avgDaily30) : 999;
  const forecastDays7 = avgDaily7 > 0 ? Math.ceil(remaining / avgDaily7) : 999;

  const forecastDate30 = new Date();
  forecastDate30.setDate(forecastDate30.getDate() + forecastDays30);
  const forecastDate7 = new Date();
  forecastDate7.setDate(forecastDate7.getDate() + forecastDays7);

  return {
    target: GOAL,
    current: totalMembers,
    remaining,
    progress: Math.round((totalMembers / GOAL) * 100),
    avgDaily30: Math.round(avgDaily30 * 10) / 10,
    avgDaily7: Math.round(avgDaily7 * 10) / 10,
    dailyGrowth: Math.round(dailyGrowth * 10) / 10,
    forecastDays30,
    forecastDays7,
    forecastDate30: forecastDate30.toISOString().split("T")[0],
    forecastDate7: forecastDate7.toISOString().split("T")[0],
    last7Days: last7,
    last30Days: last30,
  };
}

export function getEnhancedAlerts() {
  const db = getDb();
  const alerts: { type: string; severity: string; message: string; timestamp: string; data?: any }[] = [];

  const today = new Date().toISOString().split("T")[0];
  const yesterdayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')").get() as any).c;
  const todayMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')").get() as any).c;
  const avgDaily = (db.prepare("SELECT AVG(daily_count) as avg FROM (SELECT date(created_at) as day, COUNT(*) as daily_count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at))").get() as any).avg || 0;

  if (todayMembers > avgDaily * 2 && avgDaily > 0) {
    alerts.push({ type: "accelerated_growth", severity: "success", message: `Crescimento acelerado: ${todayMembers} membros hoje (média: ${avgDaily.toFixed(1)})`, timestamp: new Date().toISOString() });
  }

  if (todayMembers < avgDaily * 0.5 && avgDaily > 0) {
    alerts.push({ type: "below_average", severity: "warning", message: `Crescimento abaixo da média: ${todayMembers} membros hoje (média: ${avgDaily.toFixed(1)})`, timestamp: new Date().toISOString() });
  }

  const highConversionCampaigns = db.prepare(`SELECT utm_campaign, COUNT(*) as count FROM registrations WHERE date(created_at) = date('now') AND utm_campaign IS NOT NULL GROUP BY utm_campaign HAVING count > 5`).all() as any[];
  highConversionCampaigns.forEach(c => {
    alerts.push({ type: "winning_campaign", severity: "success", message: `Campanha vencedora: "${c.utm_campaign}" com ${c.count} membros!`, timestamp: new Date().toISOString(), data: c });
  });

  const winningContent = db.prepare(`SELECT title, whatsapp_clicks, registrations FROM content_performance WHERE date(created_at) = date('now') AND whatsapp_clicks > 10`).all() as any[];
  winningContent.forEach(c => {
    alerts.push({ type: "winning_content", severity: "success", message: `Conteúdo vencedor: "${c.title}" com ${c.whatsapp_clicks} cliques!`, timestamp: new Date().toISOString(), data: c });
  });

  const publishErrors = db.prepare(`SELECT content_id, title, result FROM content_performance WHERE status = 'error' AND date(created_at) = date('now') LIMIT 5`).all() as any[];
  publishErrors.forEach(e => {
    alerts.push({ type: "publish_error", severity: "error", message: `Falha ao publicar: "${e.title}" - ${e.result}`, timestamp: new Date().toISOString(), data: e });
  });

  const integrationErrors = db.prepare(`SELECT action, error_message FROM agent_logs WHERE status = 'error' AND date(created_at) = date('now') LIMIT 5`).all() as any[];
  integrationErrors.forEach(e => {
    alerts.push({ type: "integration_error", severity: "error", message: `Falha de integração: ${e.action} - ${e.error_message}`, timestamp: new Date().toISOString(), data: e });
  });

  const totalMembers = (db.prepare("SELECT COUNT(*) as c FROM registrations").get() as any).c;
  const GOAL = 1000;
  const progress = Math.round((totalMembers / GOAL) * 100);
  const forecastDays = avgDaily > 0 ? Math.ceil((GOAL - totalMembers) / avgDaily) : 999;
  if (forecastDays > 90 && totalMembers < GOAL) {
    alerts.push({ type: "goal_at_risk", severity: "warning", message: `Meta em risco: previsão de ${forecastDays} dias para atingir ${GOAL} membros`, timestamp: new Date().toISOString() });
  }

  return alerts.sort((a, b) => {
    const severityOrder: Record<string, number> = { error: 0, warning: 1, success: 2, info: 3 };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });
}

export function getAutonomousStatus() {
  const db = getDb();
  return {
    enabled: getAgentConfig("autonomous_mode") === "true",
    lastAnalysis: getAgentConfig("last_analysis"),
    nextAnalysis: getAgentConfig("next_analysis"),
    actionsExecuted: parseInt(getAgentConfig("actions_executed") || "0"),
    actionsPending: (db.prepare("SELECT COUNT(*) as c FROM content_queue WHERE status = 'pending'").get() as any).c,
    errors: (db.prepare("SELECT COUNT(*) as c FROM agent_logs WHERE status = 'error' AND date(created_at) = date('now')").get() as any).c,
    lastExecution: getAgentConfig("last_execution"),
    executionCount: parseInt(getAgentConfig("execution_count") || "0"),
  };
}

export function toggleAutonomousMode(enabled: boolean) {
  const db = getDb();
  setAgentConfig("autonomous_mode", enabled ? "true" : "false");
  createAgentLog({
    agent_type: "system",
    action: "toggle_autonomous",
    details: `Modo autônomo ${enabled ? "ativado" : "desativado"}`,
    status: "success",
  });
}

export function createTopic(data: {
  topic_id: string;
  title: string;
  description?: string;
  category: string;
  relevance?: number;
  traffic_potential?: number;
  conversion_potential?: number;
  priority?: number;
  tags?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO content_topics (topic_id, title, description, category, relevance, traffic_potential, conversion_potential, priority, tags)
    VALUES (@topic_id, @title, @description, @category, @relevance, @traffic_potential, @conversion_potential, @priority, @tags)`).run({
    ...data,
    description: data.description || null,
    relevance: data.relevance || 50,
    traffic_potential: data.traffic_potential || 50,
    conversion_potential: data.conversion_potential || 50,
    priority: data.priority || 50,
    tags: data.tags || null,
  });
}

export function getTopics(status?: string) {
  const db = getDb();
  if (status) {
    return db.prepare("SELECT * FROM content_topics WHERE status = ? ORDER BY priority DESC, created_at DESC").all(status) as any[];
  }
  return db.prepare("SELECT * FROM content_topics ORDER BY priority DESC, created_at DESC").all() as any[];
}

export function updateTopicStatus(topicId: string, status: string) {
  const db = getDb();
  db.prepare("UPDATE content_topics SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE topic_id = ?").run(status, topicId);
}

export function createDraft(data: {
  draft_id: string;
  topic_id?: string;
  title: string;
  description?: string;
  body?: string;
  platform: string;
  content_type: string;
  cta?: string;
  destination_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT INTO content_drafts (draft_id, topic_id, title, description, body, platform, content_type, cta, destination_url, utm_source, utm_medium, utm_campaign, utm_content)
    VALUES (@draft_id, @topic_id, @title, @description, @body, @platform, @content_type, @cta, @destination_url, @utm_source, @utm_medium, @utm_campaign, @utm_content)`).run({
    ...data,
    topic_id: data.topic_id || null,
    description: data.description || null,
    body: data.body || null,
    cta: data.cta || null,
    destination_url: data.destination_url || null,
    utm_source: data.utm_source || data.platform,
    utm_medium: data.utm_medium || "social",
    utm_campaign: data.utm_campaign || "content_engine",
    utm_content: data.utm_content || data.draft_id,
  });
}

export function getDrafts(filters?: { platform?: string; status?: string; limit?: number }) {
  const db = getDb();
  let query = "SELECT * FROM content_drafts WHERE 1=1";
  const params: any[] = [];
  if (filters?.platform) { query += " AND platform = ?"; params.push(filters.platform); }
  if (filters?.status) { query += " AND status = ?"; params.push(filters.status); }
  query += " ORDER BY created_at DESC";
  if (filters?.limit) { query += " LIMIT ?"; params.push(filters.limit); }
  return db.prepare(query).all(...params) as any[];
}

export function updateDraft(draftId: string, data: Record<string, any>) {
  const db = getDb();
  const allowed = ["title", "description", "body", "cta", "status", "scheduled_at", "published_at", "result", "score", "sessions", "registrations", "whatsapp_clicks", "referrals"];
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (allowed.includes(key)) { updates.push(`${key} = ?`); values.push(value); }
  });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(draftId);
  db.prepare(`UPDATE content_drafts SET ${updates.join(", ")} WHERE draft_id = ?`).run(...values);
}

export function getDraftStats() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM content_drafts").get() as any).c;
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM content_drafts GROUP BY status ORDER BY count DESC").all() as { status: string; count: number }[];
  const byPlatform = db.prepare("SELECT platform, COUNT(*) as count FROM content_drafts GROUP BY platform ORDER BY count DESC").all() as { platform: string; count: number }[];
  const totalSessions = (db.prepare("SELECT COALESCE(SUM(sessions), 0) as c FROM content_drafts").get() as any).c;
  const totalRegistrations = (db.prepare("SELECT COALESCE(SUM(registrations), 0) as c FROM content_drafts").get() as any).c;
  const totalWhatsapp = (db.prepare("SELECT COALESCE(SUM(whatsapp_clicks), 0) as c FROM content_drafts").get() as any).c;
  const totalReferrals = (db.prepare("SELECT COALESCE(SUM(referrals), 0) as c FROM content_drafts").get() as any).c;
  const winners = db.prepare("SELECT * FROM content_drafts WHERE status = 'vencedor' ORDER BY score DESC LIMIT 5").all() as any[];
  const losers = db.prepare("SELECT * FROM content_drafts WHERE status = 'fraco' OR (sessions > 50 AND registrations < 2) ORDER BY score ASC LIMIT 5").all() as any[];
  return { total, byStatus, byPlatform, totalSessions, totalRegistrations, totalWhatsapp, totalReferrals, winners, losers };
}

export function scheduleContent(draftId: string, scheduledFor: string) {
  const db = getDb();
  const draft = db.prepare("SELECT * FROM content_drafts WHERE draft_id = ?").get(draftId) as any;
  if (!draft) return null;
  const scheduleId = "SCH" + Date.now().toString(36).toUpperCase();
  db.prepare(`INSERT INTO content_schedule (schedule_id, draft_id, platform, scheduled_for) VALUES (?, ?, ?, ?)`).run(scheduleId, draftId, draft.platform, scheduledFor);
  updateDraft(draftId, { status: "agendado", scheduled_at: scheduledFor });
  return scheduleId;
}

export function getSchedule() {
  const db = getDb();
  return db.prepare(`SELECT cs.*, cd.title, cd.utm_campaign FROM content_schedule cs JOIN content_drafts cd ON cd.draft_id = cs.draft_id ORDER BY cs.scheduled_for ASC`).all() as any[];
}

export function checkPlatformLimit(platform: string): { allowed: boolean; current: number; limit: number } {
  const db = getDb();
  const limit = db.prepare("SELECT * FROM agent_limits WHERE platform = ?").get(platform) as any;
  const dailyLimit = limit?.daily_limit || 5;
  const today = new Date().toISOString().split("T")[0];
  const current = (db.prepare("SELECT COUNT(*) as c FROM content_drafts WHERE platform = ? AND status = 'publicado' AND date(published_at) = ?").get(platform, today) as any).c;
  return { allowed: current < dailyLimit, current, limit: dailyLimit };
}

export function setPlatformLimit(platform: string, dailyLimit: number) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO agent_limits (platform, daily_limit) VALUES (?, ?)").run(platform, dailyLimit);
}

export function getContentEngineDashboard() {
  const db = getDb();
  const topicStats = {
    total: (db.prepare("SELECT COUNT(*) as c FROM content_topics").get() as any).c,
    active: (db.prepare("SELECT COUNT(*) as c FROM content_topics WHERE status = 'active'").get() as any).c,
    used: (db.prepare("SELECT COUNT(*) as c FROM content_topics WHERE status = 'used'").get() as any).c,
  };
  const draftStats = getDraftStats();
  const schedule = getSchedule();
  const platformLimits: Record<string, { allowed: boolean; current: number; limit: number }> = {};
  ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"].forEach(p => {
    platformLimits[p] = checkPlatformLimit(p);
  });
  const recentActivity = db.prepare("SELECT * FROM content_drafts ORDER BY updated_at DESC LIMIT 10").all() as any[];
  const topPerformers = db.prepare("SELECT * FROM content_drafts WHERE sessions > 0 ORDER BY score DESC LIMIT 5").all() as any[];
  return { topicStats, draftStats, schedule, platformLimits, recentActivity, topPerformers };
}

export function generateContentForTopic(topicId: string, platform: string) {
  const db = getDb();
  const topic = db.prepare("SELECT * FROM content_topics WHERE topic_id = ?").get(topicId) as any;
  if (!topic) return null;
  const draftId = "DFT" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  const templates: Record<string, { title: string; body: string; cta: string; content_type: string }> = {
    google: { title: `${topic.title} - Guia Completo [2026]`, body: `Descubra tudo sobre ${topic.title}. ${topic.description || ""}`, cta: "Saiba Mais", content_type: "blog" },
    youtube: { title: `${topic.title} - Explicação Completa`, body: `Neste vídeo, explicamos ${topic.title.toLowerCase()}. ${topic.description || ""}`, cta: "Inscreva-se", content_type: "video" },
    tiktok: { title: `${topic.title} em 60 segundos`, body: `${topic.title}: ${topic.description || "Tudo que você precisa saber"}`, cta: "Siga para mais", content_type: "video" },
    instagram: { title: `${topic.title} 📱`, body: `${topic.title}\n\n${topic.description || ""}\n\nSalve para consultar depois!`, cta: "Link na bio", content_type: "post" },
    facebook: { title: `${topic.title} - Saiba Mais`, body: `Interessado em ${topic.title.toLowerCase()}? ${topic.description || ""}`, cta: "Clique aqui", content_type: "post" },
    pinterest: { title: `${topic.title} - Infográfico`, body: `${topic.title}: ${topic.description || "Guia completo"}`, cta: "Ver mais", content_type: "pin" },
    reddit: { title: `[Discussão] ${topic.title}`, body: `Pessoal, o que acham sobre ${topic.title.toLowerCase()}? ${topic.description || ""}`, cta: "Comente", content_type: "post" },
  };
  const template = templates[platform] || templates.google;
  const utmCampaign = `ce-${topic.category}-${platform}`;
  const utmContent = draftId.toLowerCase();
  createDraft({
    draft_id: draftId,
    topic_id: topicId,
    title: template.title,
    description: topic.description,
    body: template.body,
    platform,
    content_type: template.content_type,
    cta: template.cta,
    destination_url: "https://equipe-ademilson.vercel.app",
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: utmCampaign,
    utm_content: utmContent,
  });
  return draftId;
}

export function calculateWeightedScore() {
  const db = getDb();
  const minData = parseInt(getAgentConfig("min_data_threshold") || "5");

  const byTheme = db.prepare(`
    SELECT 
      cd.topic_id,
      ct.title as theme,
      COUNT(*) as content_count,
      COALESCE(SUM(cd.sessions), 0) as total_sessions,
      COALESCE(SUM(cd.registrations), 0) as total_registrations,
      COALESCE(SUM(cd.whatsapp_clicks), 0) as total_whatsapp,
      COALESCE(SUM(cd.referrals), 0) as total_referrals
    FROM content_drafts cd
    LEFT JOIN content_topics ct ON ct.topic_id = cd.topic_id
    WHERE cd.status IN ('publicado', 'medindo', 'vencedor')
    GROUP BY cd.topic_id
    HAVING content_count >= ?
    ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC
  `).all(minData) as any[];

  const byPlatform = db.prepare(`
    SELECT 
      platform,
      COUNT(*) as content_count,
      COALESCE(SUM(sessions), 0) as total_sessions,
      COALESCE(SUM(registrations), 0) as total_registrations,
      COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
      COALESCE(SUM(referrals), 0) as total_referrals
    FROM content_drafts
    WHERE status IN ('publicado', 'medindo', 'vencedor')
    GROUP BY platform
    HAVING content_count >= ?
    ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC
  `).all(minData) as any[];

  const byCampaign = db.prepare(`
    SELECT 
      utm_campaign,
      COUNT(*) as content_count,
      COALESCE(SUM(sessions), 0) as total_sessions,
      COALESCE(SUM(registrations), 0) as total_registrations,
      COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
      COALESCE(SUM(referrals), 0) as total_referrals
    FROM content_drafts
    WHERE status IN ('publicado', 'medindo', 'vencedor') AND utm_campaign IS NOT NULL
    GROUP BY utm_campaign
    HAVING content_count >= ?
    ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC
  `).all(minData) as any[];

  const byCTA = db.prepare(`
    SELECT 
      cta,
      COUNT(*) as content_count,
      COALESCE(SUM(sessions), 0) as total_sessions,
      COALESCE(SUM(registrations), 0) as total_registrations,
      COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
      COALESCE(SUM(referrals), 0) as total_referrals
    FROM content_drafts
    WHERE status IN ('publicado', 'medindo', 'vencedor') AND cta IS NOT NULL AND cta != ''
    GROUP BY cta
    HAVING content_count >= ?
    ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC
  `).all(minData) as any[];

  const byLandingPage = db.prepare(`
    SELECT 
      destination_url as landing_page,
      COUNT(*) as content_count,
      COALESCE(SUM(sessions), 0) as total_sessions,
      COALESCE(SUM(registrations), 0) as total_registrations,
      COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
      COALESCE(SUM(referrals), 0) as total_referrals
    FROM content_drafts
    WHERE status IN ('publicado', 'medindo', 'vencedor') AND destination_url IS NOT NULL
    GROUP BY destination_url
    HAVING content_count >= ?
    ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC
  `).all(minData) as any[];

  const scored = (items: any[]) => items.map(item => {
    const members = item.total_referrals || 0;
    const whatsapp = item.total_whatsapp || 0;
    const registrations = item.total_registrations || 0;
    const visitors = item.total_sessions || 0;
    
    const memberScore = members * 40;
    const whatsappScore = whatsapp * 30;
    const registrationScore = registrations * 20;
    const visitorScore = visitors * 10;
    const totalScore = memberScore + whatsappScore + registrationScore + visitorScore;
    
    const memberRate = visitors > 0 ? (members / visitors) : 0;
    const whatsappRate = registrations > 0 ? (whatsapp / registrations) : 0;
    const conversionRate = visitors > 0 ? (registrations / visitors) : 0;

    return {
      ...item,
      score: Math.round(totalScore * 10) / 10,
      member_rate: Math.round(memberRate * 100) / 100,
      whatsapp_rate: Math.round(whatsappRate * 100) / 100,
      conversion_rate: Math.round(conversionRate * 100) / 100,
    };
  });

  return {
    byTheme: scored(byTheme),
    byPlatform: scored(byPlatform),
    byCampaign: scored(byCampaign),
    byCTA: scored(byCTA),
    byLandingPage: scored(byLandingPage),
    minDataThreshold: minData,
    hasEnoughData: byTheme.length > 0 || byPlatform.length > 0,
  };
}

export function getLearningInsights() {
  const db = getDb();
  const score = calculateWeightedScore();
  const minData = parseInt(getAgentConfig("min_data_threshold") || "5");
  
  const insights: { type: string; priority: string; insight: string; data: any }[] = [];

  if (score.byTheme.length > 0) {
    const best = score.byTheme[0];
    insights.push({
      type: "best_theme",
      priority: "high",
      insight: `Melhor tema: "${best.theme}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`,
      data: best,
    });
    if (score.byTheme.length > 1) {
      const worst = score.byTheme[score.byTheme.length - 1];
      if (worst.score < best.score * 0.3) {
        insights.push({
          type: "theme_gap",
          priority: "medium",
          insight: `Tema "${worst.theme}" tem score ${worst.score}x menor que "${best.theme}". Considere abandonar.`,
          data: worst,
        });
      }
    }
  }

  if (score.byPlatform.length > 0) {
    const best = score.byPlatform[0];
    insights.push({
      type: "best_platform",
      priority: "high",
      insight: `Melhor plataforma: "${best.platform}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`,
      data: best,
    });
    if (score.byPlatform.length > 1) {
      const second = score.byPlatform[1];
      insights.push({
        type: "platform_comparison",
        priority: "medium",
        insight: `2ª melhor plataforma: "${second.platform}" com score ${second.score} vs ${best.score} (${best.platform})`,
        data: second,
      });
    }
  }

  if (score.byCampaign.length > 0) {
    const best = score.byCampaign[0];
    insights.push({
      type: "best_campaign",
      priority: "high",
      insight: `Melhor campanha: "${best.utm_campaign}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`,
      data: best,
    });
  }

  if (score.byCTA.length > 0) {
    const best = score.byCTA[0];
    insights.push({
      type: "best_cta",
      priority: "high",
      insight: `Melhor CTA: "${best.cta}" com ${best.total_referrals} membros e score ${best.score}`,
      data: best,
    });
  }

  if (score.byLandingPage.length > 0) {
    const best = score.byLandingPage[0];
    insights.push({
      type: "best_landing_page",
      priority: "high",
      insight: `Melhor landing page: "${best.landing_page}" com ${best.total_referrals} membros e score ${best.score}`,
      data: best,
    });
  }

  const totalDrafts = (db.prepare("SELECT COUNT(*) as c FROM content_drafts").get() as any).c;
  const publishedDrafts = (db.prepare("SELECT COUNT(*) as c FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor')").get() as any).c;
  
  if (publishedDrafts < minData) {
    insights.push({
      type: "insufficient_data",
      priority: "warning",
      insight: `Dados insuficientes: ${publishedDrafts}/${minData} conteúdos publicados. Necessário mais dados para decisões automáticas.`,
      data: { published: publishedDrafts, required: minData },
    });
  }

  const losers = db.prepare(`
    SELECT * FROM content_drafts 
    WHERE status IN ('publicado', 'medindo') 
    AND sessions > 20 AND registrations < 2
    ORDER BY sessions DESC LIMIT 5
  `).all() as any[];
  
  losers.forEach(l => {
    insights.push({
      type: "low_performance",
      priority: "low",
      insight: `"${l.title}" tem ${l.sessions} visitantes mas apenas ${l.registrations} cadastros. Considere pausar.`,
      data: l,
    });
  });

  const winners = db.prepare(`
    SELECT * FROM content_drafts 
    WHERE status IN ('publicado', 'medindo') 
    AND referrals > 0
    ORDER BY referrals DESC LIMIT 3
  `).all() as any[];
  
  winners.forEach(w => {
    insights.push({
      type: "winner_content",
      priority: "high",
      insight: `"${w.title}" gerou ${w.referrals} membros! Potencial de replicação.`,
      data: w,
    });
  });

  return { insights, score, hasEnoughData: score.hasEnoughData, minDataThreshold: minData };
}

export function getAgentMode() {
  return {
    testMode: getAgentConfig("agent_mode") !== "autonomous",
    autonomousMode: getAgentConfig("agent_mode") === "autonomous",
    paused: getAgentConfig("acquisition_paused") === "true",
    minDataThreshold: parseInt(getAgentConfig("min_data_threshold") || "5"),
  };
}

export function setAgentMode(mode: "test" | "autonomous" | "paused") {
  const db = getDb();
  if (mode === "paused") {
    setAgentConfig("acquisition_paused", "true");
  } else {
    setAgentConfig("acquisition_paused", "false");
    setAgentConfig("agent_mode", mode);
  }
  createAgentLog({
    agent_type: "content_engine",
    action: "set_mode",
    details: `Modo alterado para: ${mode}`,
    status: "success",
  });
}

export function setMinDataThreshold(threshold: number) {
  setAgentConfig("min_data_threshold", threshold.toString());
}

export function createCampaignContent(data: {
  campaign_id: string;
  content_index: number;
  platform: string;
  title: string;
  body?: string;
  cta?: string;
  url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}) {
  const db = getDb();
  db.prepare(`INSERT INTO campaign_contents (campaign_id, content_index, platform, title, body, cta, url, utm_source, utm_medium, utm_campaign, utm_content)
    VALUES (@campaign_id, @content_index, @platform, @title, @body, @cta, @url, @utm_source, @utm_medium, @utm_campaign, @utm_content)`).run({
    ...data,
    body: data.body || null,
    cta: data.cta || null,
    url: data.url || null,
    utm_source: data.utm_source || data.platform,
    utm_medium: data.utm_medium || "organic",
    utm_campaign: data.utm_campaign || "primeiro-100-membros",
    utm_content: data.utm_content || null,
  });
}

export function getCampaignContents(campaignId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM campaign_contents WHERE campaign_id = ? ORDER BY content_index ASC, platform ASC").all(campaignId) as any[];
}

export function getCampaignStats(campaignId: string) {
  const db = getDb();
  const contents = db.prepare("SELECT * FROM campaign_contents WHERE campaign_id = ?").all(campaignId) as any[];

  const totalContents = contents.length;
  const published = contents.filter(c => c.status === "publicado").length;
  const ready = contents.filter(c => c.status === "pronto").length;
  const measuring = contents.filter(c => c.status === "medindo").length;

  const totalSessions = contents.reduce((s, c) => s + (c.sessions || 0), 0);
  const totalRegistrations = contents.reduce((s, c) => s + (c.registrations || 0), 0);
  const totalWhatsapp = contents.reduce((s, c) => s + (c.whatsapp_clicks || 0), 0);
  const totalReferrals = contents.reduce((s, c) => s + (c.referrals || 0), 0);

  const byPlatform: Record<string, any> = {};
  for (const c of contents) {
    if (!byPlatform[c.platform]) {
      byPlatform[c.platform] = { platform: c.platform, count: 0, sessions: 0, registrations: 0, whatsapp_clicks: 0, referrals: 0, published: 0 };
    }
    byPlatform[c.platform].count++;
    byPlatform[c.platform].sessions += c.sessions || 0;
    byPlatform[c.platform].registrations += c.registrations || 0;
    byPlatform[c.platform].whatsapp_clicks += c.whatsapp_clicks || 0;
    byPlatform[c.platform].referrals += c.referrals || 0;
    if (c.status === "publicado") byPlatform[c.platform].published++;
  }

  const byContent: Record<number, any> = {};
  for (const c of contents) {
    if (!byContent[c.content_index]) {
      byContent[c.content_index] = { content_index: c.content_index, title: c.title, sessions: 0, registrations: 0, whatsapp_clicks: 0, referrals: 0, platforms: 0 };
    }
    byContent[c.content_index].sessions += c.sessions || 0;
    byContent[c.content_index].registrations += c.registrations || 0;
    byContent[c.content_index].whatsapp_clicks += c.whatsapp_clicks || 0;
    byContent[c.content_index].referrals += c.referrals || 0;
    byContent[c.content_index].platforms++;
  }

  const bestContent = Object.values(byContent).sort((a: any, b: any) => b.referrals - a.referrals || b.whatsapp_clicks - a.whatsapp_clicks)[0] || null;
  const bestPlatform = Object.values(byPlatform).sort((a: any, b: any) => b.referrals - a.referrals || b.whatsapp_clicks - a.whatsapp_clicks)[0] || null;

  const bestCTA = db.prepare(`
    SELECT cta, SUM(referrals) as referrals, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(registrations) as registrations
    FROM campaign_contents WHERE campaign_id = ? AND cta IS NOT NULL
    GROUP BY cta ORDER BY referrals DESC, whatsapp_clicks DESC LIMIT 1
  `).get(campaignId) as any || null;

  const bestLandingPage = db.prepare(`
    SELECT url as landing_page, SUM(referrals) as referrals, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(registrations) as registrations
    FROM campaign_contents WHERE campaign_id = ? AND url IS NOT NULL
    GROUP BY url ORDER BY referrals DESC, whatsapp_clicks DESC LIMIT 1
  `).get(campaignId) as any || null;

  return {
    campaign_id: campaignId,
    totalContents,
    published,
    ready,
    measuring,
    totalSessions,
    totalRegistrations,
    totalWhatsapp,
    totalReferrals,
    conversionRate: totalSessions > 0 ? Math.round((totalRegistrations / totalSessions) * 100) : 0,
    whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsapp / totalRegistrations) * 100) : 0,
    memberRate: totalWhatsapp > 0 ? Math.round((totalReferrals / totalWhatsapp) * 100) : 0,
    byPlatform: Object.values(byPlatform),
    byContent: Object.values(byContent),
    bestContent,
    bestPlatform,
    bestCTA,
    bestLandingPage,
  };
}

export function updateCampaignContent(campaignId: string, contentIndex: number, platform: string, data: Record<string, any>) {
  const db = getDb();
  const allowed = ["status", "sessions", "registrations", "whatsapp_clicks", "referrals", "score", "published_at"];
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (allowed.includes(key)) { updates.push(`${key} = ?`); values.push(value); }
  });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(campaignId, contentIndex, platform);
  db.prepare(`UPDATE campaign_contents SET ${updates.join(", ")} WHERE campaign_id = ? AND content_index = ? AND platform = ?`).run(...values);
}

export function seedPrimeiraCampanha() {
  const campaignId = "primeiro-100-membros";
  const SITE_URL = "https://equipe-ademilson.vercel.app";
  const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

  const contents = [
    // CONTEÚDO 01 — O que são os vídeos para treinamento de IA
    {
      index: 1, platform: "youtube",
      title: "O que SÃO os Vídeos para Treinamento de IA? (Explicação Completa)",
      body: "Neste vídeo, explicamos o que são os vídeos para treinamento de inteligência artificial, por que empresas pagam por eles e como você pode participar gravando vídeos do dia a dia.",
      cta: "Link na descrição para entrar no grupo",
      utm_content: "video-01-youtube",
    },
    {
      index: 1, platform: "tiktok",
      title: "O que são os Vídeos para IA em 60 Segundos",
      body: "Você sabia que a IA precisa de vídeos reais para aprender? Grave do dia adia e ganhe em dólar. Explico em 60 segundos.",
      cta: "Link na bio",
      utm_content: "video-01-tiktok",
    },
    {
      index: 1, platform: "instagram",
      title: "🤖 O que são Vídeos para Treinamento de IA?",
      body: "A inteligência artificial precisa assistir vídeos reais para aprender. E você pode ganhar dinheiro gravando esses vídeos. Salve para consultar depois!",
      cta: "Link na bio para saber mais",
      utm_content: "video-01-instagram",
    },
    {
      index: 1, platform: "facebook",
      title: "Você Sabia que a IA Precisa de Vídeos para Aprender?",
      body: "Empresas de tecnologia precisam de vídeos reais do dia a dia para treinar seus sistemas de IA. E pagam por isso. Saiba como funciona.",
      cta: "Clique no link para entrar no grupo",
      utm_content: "video-01-facebook",
    },
    {
      index: 1, platform: "pinterest",
      title: "O que são Vídeos para Treinamento de IA — Guia Completo",
      body: "Descubra o que são os vídeos para treinamento de IA, como funcionam e por que estão se tornando uma oportunidade de renda extra.",
      cta: "Saiba mais no site",
      utm_content: "video-01-pinterest",
    },
    {
      index: 1, platform: "reddit",
      title: "[Discussão] Alguém pode explicar o que são vídeos para treinamento de IA?",
      body: "Estou vendo muita gente falando sobre gravar vídeos para treinar IA. Alguém pode explicar como funciona na prática? Quero entender melhor antes de participar.",
      cta: "Mais informações no link",
      utm_content: "video-01-reddit",
    },

    // CONTEÚDO 02 — Como funciona a participação no projeto
    {
      index: 2, platform: "youtube",
      title: "Como Funciona a PARTICIPAÇÃO no Projeto de Vídeos para IA (Passo a Passo)",
      body: "Neste vídeo, mostramos como funciona a participação no projeto: desde o cadastro até a gravação dos primeiros vídeos. Tudo explicado passo a passo.",
      cta: "Link na descrição para começar",
      utm_content: "video-02-youtube",
    },
    {
      index: 2, platform: "tiktok",
      title: "Passo a Passo para Participar do Projeto de IA",
      body: "1. Entre no grupo. 2. Faça o cadastro. 3. Grave vídeos do dia a dia. 4. Ganhe em dólar. Simples assim!",
      cta: "Link na bio para começar",
      utm_content: "video-02-tiktok",
    },
    {
      index: 2, platform: "instagram",
      title: "📸 Como Participar do Projeto — Passo a Passo",
      body: "Passo 1: Entre no grupo WhatsApp.\nPasso 2: Faça seu cadastro.\nPasso 3: Grave vídeos do dia a dia.\nPasso 4: Receba em dólar.\n\nSalve esse post!",
      cta: "Link na bio para começar",
      utm_content: "video-02-instagram",
    },
    {
      index: 2, platform: "facebook",
      title: "Como Participar: 4 Passos Simples para Ganhar com Vídeos para IA",
      body: "1. Entre no nosso grupo WhatsApp gratuito.\n2. Faça seu cadastro rápido.\n3. Grave vídeos do seu dia a dia.\n4. Receba seus ganhos em dólar.\n\nNão precisa de experiência prévia.",
      cta: "Entre no grupo pelo link",
      utm_content: "video-02-facebook",
    },
    {
      index: 2, platform: "pinterest",
      title: "Guia: Como Participar do Projeto de Gravação para IA",
      body: "Passo a passo completo para começar a gravar vídeos para treinamento de IA. Do cadastro à primeira gravação.",
      cta: "Saiba mais no site",
      utm_content: "video-02-pinterest",
    },
    {
      index: 2, platform: "reddit",
      title: "Guia: Como começar a gravar vídeos para treinamento de IA",
      body: "Fiz um resumo do processo: cadastro no grupo, gravação de vídeos do dia a dia, envio e pagamento. Alguém já participou? Como foi a experiência?",
      cta: "Link para mais detalhes",
      utm_content: "video-02-reddit",
    },

    // CONTEÚDO 03 — Quem pode participar
    {
      index: 3, platform: "youtube",
      title: "Quem PODE Participar? (Requisitos para Gravar Vídeos para IA)",
      body: "Neste vídeo, explicamos quem pode participar do projeto. Spoiler: se você tem um smartphone e sabe gravar um vídeo, já pode começar.",
      cta: "Link na descrição para se inscrever",
      utm_content: "video-03-youtube",
    },
    {
      index: 3, platform: "tiktok",
      title: "Você Pode Participar? Veja os Requisitos",
      body: "Precisa de smartphone? Sim. Precisa de experiência? Não. Precisa de setup profissional? Também não. Veja se você se encaixa.",
      cta: "Link na bio",
      utm_content: "video-03-tiktok",
    },
    {
      index: 3, platform: "instagram",
      title: "👤 Quem Pode Participar do Projeto?",
      body: "✅ Tem smartphone\n✅ Sabe gravar um vídeo\n✅ Quer ganhar dinheiro extra\n\nNão precisa de experiência. Não precisa de equipamento profissional.\n\nMarque um amigo que se encaixa!",
      cta: "Link na bio para se inscrever",
      utm_content: "video-03-instagram",
    },
    {
      index: 3, platform: "facebook",
      title: "Quem Pode Participar? Veja os Requisitos Simples",
      body: "Para participar, você precisa apenas de:\n• Um smartphone\n• Vontade de aprender\n• 10-15 minutos por dia\n\nNão precisa de experiência prévia. Não precisa de equipamento profissional.",
      cta: "Entre no grupo e descubra",
      utm_content: "video-03-facebook",
    },
    {
      index: 3, platform: "pinterest",
      title: "Quem Pode Participar do Projeto de Vídeos para IA?",
      body: "Requisitos simples: smartphone, vontade de aprender e disponibilidade. Não precisa de experiência. Veja os detalhes completos.",
      cta: "Saiba mais",
      utm_content: "video-03-pinterest",
    },
    {
      index: 3, platform: "reddit",
      title: "Requisitos para participar do projeto de gravação de vídeos para IA",
      body: "Vi que precisa basicamente de smartphone e cadastro no grupo. Alguém sabe se aceita pessoas de qualquer estado? Como funciona a verificação dos vídeos?",
      cta: "Link para os requisitos completos",
      utm_content: "video-03-reddit",
    },

    // CONTEÚDO 04 — Quanto uma pessoa pode ganhar
    {
      index: 4, platform: "youtube",
      title: "QUANTO GANHA quem Grava Vídeos para IA? (Valores Reais, Sem Mito)",
      body: "Neste vídeo, falamos sobre quanto é possível ganhar gravando vídeos para treinamento de IA. Importante: valores são estimativas e NÃO são garantia de ganho.",
      cta: "Link na descrição para começar",
      utm_content: "video-04-youtube",
    },
    {
      index: 4, platform: "tiktok",
      title: "Quanto Ganha? (Sem Mito, Sem Garantia)",
      body: "Valores variam muito. Não é garantia. Mas mostramos o que as pessoas estão conseguindo. Lembre: resultados não são garantidos.",
      cta: "Link na bio para saber mais",
      utm_content: "video-04-tiktok",
    },
    {
      index: 4, platform: "instagram",
      title: "💰 Quanto é Possível Ganhar? (Valores Estimados)",
      body: "⚠️ ATENÇÃO: Valores são estimativas. NÃO são garantia de ganho.\n\nMostramos a faixa estimada para você ter uma ideia. Cada pessoa tem um resultado diferente.\n\nSalve para não esquecer!",
      cta: "Link na bio para detalhes",
      utm_content: "video-04-instagram",
    },
    {
      index: 4, platform: "facebook",
      title: "Quanto Ganha quem Grava Vídeos para IA? (Valores Estimados)",
      body: "Importante: valores são estimativas e NÃO são garantia.\n\nMostramos a faixa estimada para você ter uma ideia do potencial. Cada pessoa tem um resultado diferente dependendo de vários fatores.",
      cta: "Saiba mais no grupo",
      utm_content: "video-04-facebook",
    },
    {
      index: 4, platform: "pinterest",
      title: "Quanto Ganha quem Grava Vídeos para IA? (Estimativas)",
      body: "Valores estimados — não são garantia. Veja a faixa de ganho potencial e entenda os fatores que influenciam seus resultados.",
      cta: "Ver detalhes no site",
      utm_content: "video-04-pinterest",
    },
    {
      index: 4, platform: "reddit",
      title: "Quanto é possível ganhar gravando vídeos para IA? (sem hype)",
      body: "Quero dados reais, sem exagero. Alguém que já participa pode compartilhar quanto conseguiu ganhar? Valores estimados ou reais. Sem promessas.",
      cta: "Link para ver estimativas",
      utm_content: "video-04-reddit",
    },

    // CONTEÚDO 05 — Como entrar e começar
    {
      index: 5, platform: "youtube",
      title: "COMO ENTRAR e Começar Agora (Grupo WhatsApp + Cadastro)",
      body: "Neste vídeo, mostramos exatamente como entrar no grupo WhatsApp, fazer seu cadastro e começar a gravar seus primeiros vídeos para IA.",
      cta: "Link na descrição — entre agora",
      utm_content: "video-05-youtube",
    },
    {
      index: 5, platform: "tiktok",
      title: "Como Começar AGORA (3 Passos Rápidos)",
      body: "1. Clica no link da bio. 2. Entra no grupo WhatsApp. 3. Faz o cadastro. Pronto, já pode começar!",
      cta: "Link na bio — comece agora",
      utm_content: "video-05-tiktok",
    },
    {
      index: 5, platform: "instagram",
      title: "🚀 Como Começar Agora — 3 Passos",
      body: "1️⃣ Clique no link da bio\n2️⃣ Entre no grupo WhatsApp gratuito\n3️⃣ Faça seu cadastro\n\nEm menos de 5 minutos você está dentro.\n\nMarque quem precisa de renda extra!",
      cta: "Link na bio — comece agora",
      utm_content: "video-05-instagram",
    },
    {
      index: 5, platform: "facebook",
      title: "Como Começar a Ganhar com Vídeos para IA (Guia Rápido)",
      body: "Passo 1: Entre no nosso grupo WhatsApp (link nos comentários).\nPasso 2: Faça seu cadastro gratuito.\nPasso 3: Assista o tutorial e grave seu primeiro vídeo.\n\nComece hoje mesmo!",
      cta: "Entre no grupo pelo link",
      utm_content: "video-05-facebook",
    },
    {
      index: 5, platform: "pinterest",
      title: "Como Começar a Gravar Vídeos para IA — Guia Rápido",
      body: "Guia passo a passo: como entrar no grupo, fazer cadastro e começar a gravar seus primeiros vídeos para treinamento de IA.",
      cta: "Comece agora no site",
      utm_content: "video-05-pinterest",
    },
    {
      index: 5, platform: "reddit",
      title: "Como começar: guia rápido para gravar vídeos para IA",
      body: "Resumo rápido: entre no grupo WhatsApp (link), faça o cadastro e comece a gravar. Alguém tem dicas para iniciantes? Quero começar mas não sei por onde.",
      cta: "Link para começar",
      utm_content: "video-05-reddit",
    },
  ];

  let created = 0;
  for (const c of contents) {
    const utmSource = c.platform;
    const utmMedium = "organic";
    const utmCampaign = "primeiro-100-membros";
    const utmContent = c.utm_content;
    const utmParams = `utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}`;
    const url = `${SITE_URL}?${utmParams}`;
    const waUrl = `${WA_GROUP}?${utmParams}`;

    const finalUrl = c.platform === "facebook" ? waUrl : url;

    createCampaignContent({
      campaign_id: campaignId,
      content_index: c.index,
      platform: c.platform,
      title: c.title,
      body: c.body,
      cta: c.cta,
      url: finalUrl,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
    });
    created++;
  }

  createAgentLog({
    agent_type: "content_engine",
    action: "seed_campaign",
    details: `Campanha "${campaignId}" criada com ${created} conteúdos`,
    status: "success",
  });

  return { campaign_id: campaignId, created };
}

export default getDb;