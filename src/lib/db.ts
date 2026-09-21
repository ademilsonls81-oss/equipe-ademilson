import { createClient, Client } from "@libsql/client";

let _client: Client | null = null;

function getClient(): Client {
  if (_client) return _client;
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return _client;
}

let _initialized = false;

async function ensureSchema() {
  if (_initialized) return;
  _initialized = true;
}

async function getDb(): Promise<Client> {
  return getClient();
}

async function runGet(sql: string, args: any[] = []): Promise<any> {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  return result.rows[0] || null;
}

async function runAll(sql: string, args: any[] = []): Promise<any[]> {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  return result.rows;
}

async function runExec(sql: string, args: any[] = []): Promise<void> {
  const db = await getDb();
  await db.execute({ sql, args });
}

export interface Registration {
  id: number; uid: string; name: string; whatsapp: string; city: string;
  state: string; age_range: string; has_smartphone: string; has_support: string;
  how_found: string; referral_code: string | null; utm_source: string | null;
  utm_medium: string | null; utm_campaign: string | null; ip_address: string | null;
  created_at: string;
}
export interface RegWithRefs extends Registration { referrals_count: number; my_referral_code: string | null; }

export async function createRegistration(data: Omit<Registration, "id" | "created_at">): Promise<Registration> {
  await runExec(`INSERT INTO registrations (uid,name,whatsapp,city,state,age_range,has_smartphone,has_support,how_found,referral_code,utm_source,utm_medium,utm_campaign,ip_address) VALUES (@uid,@name,@whatsapp,@city,@state,@age_range,@has_smartphone,@has_support,@how_found,@referral_code,@utm_source,@utm_medium,@utm_campaign,@ip_address)`, [data.uid, data.name, data.whatsapp, data.city, data.state, data.age_range, data.has_smartphone, data.has_support, data.how_found, data.referral_code, data.utm_source, data.utm_medium, data.utm_campaign, data.ip_address]);
  return await runGet("SELECT * FROM registrations WHERE uid = ?", [data.uid]) as Registration;
}

export async function createReferralCode(uid: string, code: string) {
  await runExec("INSERT OR IGNORE INTO referral_codes (code,registration_uid) VALUES (?,?)", [code, uid]);
}

export async function getReferralCode(code: string) {
  return await runGet("SELECT * FROM referral_codes WHERE code = ?", [code]);
}

export async function getAllRegistrations(limit = 200, offset = 0): Promise<RegWithRefs[]> {
  return await runAll(`SELECT r.*, rc.code as my_referral_code, (SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code = rc.code) as referrals_count FROM registrations r LEFT JOIN referral_codes rc ON rc.registration_uid = r.uid ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]) as RegWithRefs[];
}

export async function getCount(): Promise<number> {
  const row = await runGet("SELECT COUNT(*) as c FROM registrations");
  return row?.c || 0;
}

export async function getStats() {
  const total = await getCount();
  const by_state = await runAll("SELECT state, COUNT(*) as count FROM registrations GROUP BY state ORDER BY count DESC");
  const by_how_found = await runAll("SELECT how_found, COUNT(*) as count FROM registrations GROUP BY how_found ORDER BY count DESC");
  const weekRow = await runGet("SELECT COUNT(*) as c FROM registrations WHERE created_at >= datetime('now','-7 days')");
  return { total, by_state, by_how_found, recent_week: weekRow?.c || 0 };
}

export async function exportCsv(): Promise<string> {
  const rows = await runAll(`SELECT r.id,r.name,r.whatsapp,r.city,r.state,r.age_range,r.has_smartphone,r.has_support,r.how_found,r.referral_code as veio_do_codigo,rc.code as meu_codigo,(SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code=rc.code) as indicacoes,r.utm_source,r.utm_medium,r.utm_campaign,r.created_at FROM registrations r LEFT JOIN referral_codes rc ON rc.registration_uid=r.uid ORDER BY r.created_at DESC`);
  if (!rows.length) return "Nenhum cadastro";
  const h = Object.keys(rows[0]).join(",");
  const body = rows.map((r: any) => Object.values(r).map((v: any) => v == null ? "" : `"${String(v).replace(/"/g,'""')}"`).join(","));
  return [h, ...body].join("\n");
}

export async function getReferralStats(code: string) {
  const refCode = await runGet("SELECT * FROM referral_codes WHERE code = ?", [code]) as any;
  if (!refCode) return null;
  const registration = await runGet("SELECT * FROM registrations WHERE uid = ?", [refCode.registration_uid]) as Registration;
  if (!registration) return null;
  const countRow = await runGet("SELECT COUNT(*) as c FROM registrations WHERE referral_code = ?", [code]);
  return { ...registration, my_referral_code: code, referrals_count: countRow?.c || 0 };
}

export async function getTopReferrers(limit: number = 10) {
  return await runAll(`SELECT rc.code, r.name, r.city, r.state, (SELECT COUNT(*) FROM registrations r2 WHERE r2.referral_code = rc.code) as referrals_count FROM referral_codes rc JOIN registrations r ON r.uid = rc.registration_uid WHERE rc.code IN (SELECT referral_code FROM registrations WHERE referral_code IS NOT NULL GROUP BY referral_code HAVING COUNT(*) > 0) ORDER BY referrals_count DESC LIMIT ?`, [limit]);
}

export async function createSession(data: {
  session_id: string; ip_address?: string; user_agent?: string; referrer?: string;
  landing_page?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string;
}) {
  await runExec(`INSERT OR IGNORE INTO sessions (session_id, ip_address, user_agent, referrer, landing_page, utm_source, utm_medium, utm_campaign) VALUES (?,?,?,?,?,?,?,?)`, [data.session_id, data.ip_address || null, data.user_agent || null, data.referrer || null, data.landing_page || null, data.utm_source || null, data.utm_medium || null, data.utm_campaign || null]);
}

export async function linkSessionToRegistration(sessionId: string, uid: string) {
  await runExec("UPDATE sessions SET registered_uid = ? WHERE session_id = ?", [uid, sessionId]);
}

export async function markSessionClickedWhatsApp(sessionId: string) {
  await runExec("UPDATE sessions SET clicked_whatsapp = 1 WHERE session_id = ?", [sessionId]);
}

export async function markSessionJoinedWhatsApp(sessionId: string) {
  await runExec("UPDATE sessions SET joined_whatsapp = 1 WHERE session_id = ?", [sessionId]);
}

export async function getFunnelStats() {
  const today = new Date().toISOString().split("T")[0];
  const totalSessions = (await runGet("SELECT COUNT(*) as c FROM sessions"))?.c || 0;
  const sessionsToday = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE date(created_at) = ?", [today]))?.c || 0;
  const registered = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE registered_uid IS NOT NULL"))?.c || 0;
  const registeredToday = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE registered_uid IS NOT NULL AND date(created_at) = ?", [today]))?.c || 0;
  const clickedWhatsApp = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1"))?.c || 0;
  const joinedWhatsApp = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE joined_whatsapp = 1"))?.c || 0;
  const bySource = await runAll("SELECT utm_source as source, COUNT(*) as sessions, SUM(CASE WHEN registered_uid IS NOT NULL THEN 1 ELSE 0 END) as registrations FROM sessions WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY sessions DESC");
  const byLandingPage = await runAll("SELECT landing_page, COUNT(*) as sessions, SUM(CASE WHEN registered_uid IS NOT NULL THEN 1 ELSE 0 END) as registrations FROM sessions WHERE landing_page IS NOT NULL GROUP BY landing_page ORDER BY sessions DESC LIMIT 10");
  return {
    totalSessions, sessionsToday, registered, registeredToday, clickedWhatsApp, joinedWhatsApp,
    conversionRate: totalSessions > 0 ? Math.round((registered / totalSessions) * 100) : 0,
    whatsappRate: registered > 0 ? Math.round((clickedWhatsApp / registered) * 100) : 0,
    bySource, byLandingPage,
  };
}

export async function getAnalytics() {
  const today = new Date().toISOString().split("T")[0];
  const total = await getCount();
  const joinedToday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?", [today]))?.c || 0;
  const joinedYesterday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"))?.c || 0;
  const bySource = await runAll("SELECT utm_source as source, COUNT(*) as count FROM registrations WHERE utm_source IS NOT NULL AND utm_source != '' GROUP BY utm_source ORDER BY count DESC");
  const byCampaign = await runAll("SELECT utm_campaign as campaign, COUNT(*) as count FROM registrations WHERE utm_campaign IS NOT NULL AND utm_campaign != '' GROUP BY utm_campaign ORDER BY count DESC");
  const byHowFound = await runAll("SELECT how_found, COUNT(*) as count FROM registrations GROUP BY how_found ORDER BY count DESC");
  const last7Days = await runAll("SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day");
  const referralsToday = (await runGet(`SELECT COUNT(*) as c FROM registrations r JOIN referral_codes rc ON r.referral_code = rc.code WHERE date(r.created_at) = ?`, [today]))?.c || 0;
  const referralsTotal = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE referral_code IS NOT NULL AND referral_code != ''"))?.c || 0;
  return { total, joinedToday, joinedYesterday, growth: joinedToday, bySource, byCampaign, byHowFound, last7Days, referralsToday, referralsTotal, bestCampaign: byCampaign[0] || null, bestSource: bySource[0] || null };
}

export async function createContentPerformance(data: { content_id: string; title: string; platform: string; content_type: string; theme?: string; keywords?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; url?: string }) {
  await runExec(`INSERT OR IGNORE INTO content_performance (content_id, title, platform, content_type, theme, keywords, utm_source, utm_medium, utm_campaign, url) VALUES (?,?,?,?,?,?,?,?,?,?)`, [data.content_id, data.title, data.platform, data.content_type, data.theme || null, data.keywords || null, data.utm_source || null, data.utm_medium || null, data.utm_campaign || null, data.url || null]);
}

export async function updateContentPerformance(contentId: string, data: { sessions?: number; registrations?: number; whatsapp_clicks?: number; whatsapp_joins?: number; referrals?: number; score?: number; status?: string }) {
  const sets: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) { sets.push(`${k} = ?`); values.push(v); } });
  if (sets.length === 0) return;
  sets.push("updated_at = CURRENT_TIMESTAMP");
  values.push(contentId);
  await runExec(`UPDATE content_performance SET ${sets.join(", ")} WHERE content_id = ?`, values);
}

export async function getContentPerformance(filters?: { platform?: string; status?: string; limit?: number }) {
  let query = "SELECT * FROM content_performance WHERE 1=1";
  const params: any[] = [];
  if (filters?.platform) { query += " AND platform = ?"; params.push(filters.platform); }
  if (filters?.status) { query += " AND status = ?"; params.push(filters.status); }
  query += " ORDER BY score DESC";
  if (filters?.limit) { query += ` LIMIT ${filters.limit}`; }
  return await runAll(query, params);
}

export async function getContentStats() {
  const total = (await runGet("SELECT COUNT(*) as c FROM content_performance"))?.c || 0;
  const active = (await runGet("SELECT COUNT(*) as c FROM content_performance WHERE status = 'active'"))?.c || 0;
  const totalSessions = (await runGet("SELECT COALESCE(SUM(sessions),0) as c FROM content_performance"))?.c || 0;
  const totalRegistrations = (await runGet("SELECT COALESCE(SUM(registrations),0) as c FROM content_performance"))?.c || 0;
  const totalWhatsappClicks = (await runGet("SELECT COALESCE(SUM(whatsapp_clicks),0) as c FROM content_performance"))?.c || 0;
  const totalWhatsappJoins = (await runGet("SELECT COALESCE(SUM(whatsapp_joins),0) as c FROM content_performance"))?.c || 0;
  const byPlatform = await runAll("SELECT platform, COUNT(*) as count, SUM(sessions) as sessions, SUM(registrations) as registrations, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(whatsapp_joins) as whatsapp_joins, AVG(score) as avg_score FROM content_performance GROUP BY platform ORDER BY avg_score DESC");
  const byTheme = await runAll("SELECT theme, COUNT(*) as count, SUM(sessions) as sessions, SUM(registrations) as registrations, AVG(score) as avg_score FROM content_performance WHERE theme IS NOT NULL GROUP BY theme ORDER BY avg_score DESC");
  const bestContent = await runGet("SELECT * FROM content_performance ORDER BY score DESC LIMIT 1");
  const worstContent = await runGet("SELECT * FROM content_performance WHERE sessions > 0 ORDER BY score ASC LIMIT 1");
  return {
    total, active, totalSessions, totalRegistrations, totalWhatsappClicks, totalWhatsappJoins,
    conversionRate: totalSessions > 0 ? Math.round((totalRegistrations / totalSessions) * 100) : 0,
    whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsappClicks / totalRegistrations) * 100) : 0,
    byPlatform, byTheme, bestContent, worstContent,
  };
}

export async function createAgentLog(data: { agent_type: string; action: string; details?: string; status?: string; error_message?: string }) {
  await runExec(`INSERT INTO agent_logs (agent_type, action, details, status, error_message) VALUES (?,?,?,?,?)`, [data.action ? data.agent_type : "", data.action, data.details || null, data.status || "success", data.error_message || null]);
}

export async function getAgentLogs(limit = 50) {
  return await runAll("SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?", [limit]);
}

export async function getAgentConfig(key: string) {
  const row = await runGet("SELECT config_value FROM agent_config WHERE config_key = ?", [key]);
  return row?.config_value || null;
}

export async function setAgentConfig(key: string, value: string) {
  await runExec("INSERT OR REPLACE INTO agent_config (config_key, config_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", [key, value]);
}

export async function createReferralTracking(data: { referrer_uid: string; referral_code: string; link_used?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; platform?: string; share_text?: string; ab_test_id?: string; visitor_session_id?: string }) {
  await runExec(`INSERT INTO referral_tracking (referrer_uid, referral_code, link_used, utm_source, utm_medium, utm_campaign, platform, share_text, ab_test_id, visitor_session_id) VALUES (?,?,?,?,?,?,?,?,?,?)`, [data.referrer_uid, data.referral_code, data.link_used || null, data.utm_source || null, data.utm_medium || null, data.utm_campaign || null, data.platform || null, data.share_text || null, data.ab_test_id || null, data.visitor_session_id || null]);
}

export async function markReferralConverted(visitorSessionId: string, convertedUid: string) {
  await runExec("UPDATE referral_tracking SET converted = 1, converted_uid = ? WHERE visitor_session_id = ? AND converted = 0", [convertedUid, visitorSessionId]);
}

export async function getReferralStatsAdvanced() {
  const today = new Date().toISOString().split("T")[0];
  const totalReferrals = (await runGet("SELECT COUNT(*) as c FROM referral_tracking"))?.c || 0;
  const convertedReferrals = (await runGet("SELECT COUNT(*) as c FROM referral_tracking WHERE converted = 1"))?.c || 0;
  const referralsToday = (await runGet("SELECT COUNT(*) as c FROM referral_tracking WHERE date(created_at) = ?", [today]))?.c || 0;
  const convertedToday = (await runGet("SELECT COUNT(*) as c FROM referral_tracking WHERE converted = 1 AND date(created_at) = ?", [today]))?.c || 0;
  const byPlatform = await runAll("SELECT platform, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE platform IS NOT NULL GROUP BY platform ORDER BY total DESC");
  const bySource = await runAll("SELECT utm_source as source, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY total DESC");
  const topReferrers = await runAll(`SELECT rt.referrer_uid, r.name, r.city, r.state, COUNT(*) as total_referrals, SUM(CASE WHEN rt.converted = 1 THEN 1 ELSE 0 END) as conversions FROM referral_tracking rt JOIN registrations r ON r.uid = rt.referrer_uid GROUP BY rt.referrer_uid ORDER BY conversions DESC LIMIT 10`);
  const byDay = await runAll("SELECT date(created_at) as day, COUNT(*) as total, SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted FROM referral_tracking WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day");
  const growthCoefficient = totalReferrals > 0 ? (convertedReferrals / totalReferrals) : 0;
  return { totalReferrals, convertedReferrals, referralsToday, convertedToday, conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0, growthCoefficient: Math.round(growthCoefficient * 100) / 100, byPlatform, bySource, topReferrers, byDay };
}

export async function createABTest(data: { test_id: string; test_name: string; test_type: string; variant_a: string; variant_b: string; metric?: string }) {
  await runExec(`INSERT OR IGNORE INTO ab_tests (test_id, test_name, test_type, variant_a, variant_b, metric) VALUES (?,?,?,?,?,?)`, [data.test_id, data.test_name, data.test_type, data.variant_a, data.variant_b, data.metric || "conversion"]);
}

export async function assignABVariant(testId: string, sessionId: string): Promise<string> {
  const existing = await runGet("SELECT variant FROM ab_assignments WHERE test_id = ? AND session_id = ?", [testId, sessionId]) as any;
  if (existing) return existing.variant;
  const variant = Math.random() < 0.5 ? "A" : "B";
  await runExec("INSERT OR IGNORE INTO ab_assignments (test_id, session_id, variant) VALUES (?,?,?)", [testId, sessionId, variant]);
  return variant;
}

export async function recordABConversion(testId: string, sessionId: string) {
  const assignment = await runGet("SELECT variant FROM ab_assignments WHERE test_id = ? AND session_id = ?", [testId, sessionId]) as any;
  if (!assignment) return;
  const test = await runGet("SELECT * FROM ab_tests WHERE test_id = ?", [testId]) as any;
  if (!test) return;
  const variantAConversions = (await runGet("SELECT COUNT(*) as c FROM ab_assignments aa WHERE aa.test_id = ? AND aa.variant = 'A' AND aa.session_id IN (SELECT visitor_session_id FROM referral_tracking WHERE converted = 1)", [testId]))?.c || 0;
  const variantBConversions = (await runGet("SELECT COUNT(*) as c FROM ab_assignments aa WHERE aa.test_id = ? AND aa.variant = 'B' AND aa.session_id IN (SELECT visitor_session_id FROM referral_tracking WHERE converted = 1)", [testId]))?.c || 0;
  const variantATotal = (await runGet("SELECT COUNT(*) as c FROM ab_assignments WHERE test_id = ? AND variant = 'A'", [testId]))?.c || 0;
  const variantBTotal = (await runGet("SELECT COUNT(*) as c FROM ab_assignments WHERE test_id = ? AND variant = 'B'", [testId]))?.c || 0;
  const rateA = variantATotal > 0 ? variantAConversions / variantATotal : 0;
  const rateB = variantBTotal > 0 ? variantBConversions / variantBTotal : 0;
  let winner = null;
  if (variantATotal >= 10 && variantBTotal >= 10) {
    if (rateA > rateB * 1.1) winner = "A";
    else if (rateB > rateA * 1.1) winner = "B";
  }
  if (winner) {
    await runExec("UPDATE ab_tests SET winner = ?, ended_at = CURRENT_TIMESTAMP WHERE test_id = ? AND winner IS NULL", [winner, testId]);
  }
  return { variantA: { conversions: variantAConversions, total: variantATotal, rate: rateA }, variantB: { conversions: variantBConversions, total: variantBTotal, rate: rateB }, winner };
}

export async function getABTests() {
  return await runAll("SELECT * FROM ab_tests ORDER BY created_at DESC");
}

export async function getABTestResults(testId: string) {
  const test = await runGet("SELECT * FROM ab_tests WHERE test_id = ?", [testId]) as any;
  if (!test) return null;
  const variantA = (await runGet("SELECT COUNT(*) as total FROM ab_assignments WHERE test_id = ? AND variant = 'A'", [testId]))?.total || 0;
  const variantB = (await runGet("SELECT COUNT(*) as total FROM ab_assignments WHERE test_id = ? AND variant = 'B'", [testId]))?.total || 0;
  return { ...test, variantA, variantB };
}

export async function getGrowthMetrics() {
  const today = new Date().toISOString().split("T")[0];
  const totalMembers = (await runGet("SELECT COUNT(*) as c FROM registrations"))?.c || 0;
  const membersToday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?", [today]))?.c || 0;
  const membersYesterday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"))?.c || 0;
  const referralMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE referral_code IS NOT NULL AND referral_code != ''"))?.c || 0;
  const directMembers = totalMembers - referralMembers;
  const last7Days = await runAll("SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day");
  const last30Days = await runAll("SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day");
  const growthRate = membersYesterday > 0 ? ((membersToday - membersYesterday) / membersYesterday * 100) : 0;
  const viralCoefficient = totalMembers > 0 ? (referralMembers / totalMembers) : 0;
  return { totalMembers, membersToday, membersYesterday, referralMembers, directMembers, growthRate: Math.round(growthRate * 10) / 10, viralCoefficient: Math.round(viralCoefficient * 100) / 100, last7Days, last30Days };
}

export async function getCommandCenterData() {
  const today = new Date().toISOString().split("T")[0];
  const GOAL = 1000;
  const visitorsToday = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE date(created_at) = ?", [today]))?.c || 0;
  const registrationsToday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?", [today]))?.c || 0;
  const whatsappClicksToday = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1 AND date(created_at) = ?", [today]))?.c || 0;
  const newMembersToday = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = ?", [today]))?.c || 0;
  const newReferralsToday = (await runGet("SELECT COUNT(*) as c FROM referral_tracking WHERE date(created_at) = ?", [today]))?.c || 0;
  const totalVisitors = (await runGet("SELECT COUNT(*) as c FROM sessions"))?.c || 0;
  const totalRegistrations = (await runGet("SELECT COUNT(*) as c FROM registrations"))?.c || 0;
  const totalWhatsappClicks = (await runGet("SELECT COUNT(*) as c FROM sessions WHERE clicked_whatsapp = 1"))?.c || 0;
  const totalMembers = (await runGet("SELECT COUNT(*) as c FROM registrations"))?.c || 0;
  const totalReferrals = (await runGet("SELECT COUNT(*) as c FROM referral_tracking"))?.c || 0;
  const funnel = {
    visitors: totalVisitors, registrations: totalRegistrations, whatsappClicks: totalWhatsappClicks, members: totalMembers, referrals: totalReferrals,
    registrationRate: totalVisitors > 0 ? Math.round((totalRegistrations / totalVisitors) * 100) : 0,
    whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsappClicks / totalRegistrations) * 100) : 0,
    memberRate: totalWhatsappClicks > 0 ? Math.round((totalMembers / totalWhatsappClicks) * 100) : 0,
    referralRate: totalMembers > 0 ? Math.round((totalReferrals / totalMembers) * 100) : 0,
  };
  const byOrigin = await runAll(`SELECT COALESCE(utm_source, 'direct') as origin, COUNT(*) as count, SUM(CASE WHEN clicked_whatsapp = 1 THEN 1 ELSE 0 END) as whatsapp_clicks FROM sessions GROUP BY origin ORDER BY count DESC`);
  const byCity = await runAll(`SELECT city, state, COUNT(*) as count FROM registrations GROUP BY city, state ORDER BY count DESC LIMIT 10`);
  const bestContent = await runGet(`SELECT title, score, registrations, whatsapp_clicks FROM content_performance ORDER BY registrations DESC LIMIT 1`);
  const bestCampaign = await runGet(`SELECT utm_campaign as campaign, COUNT(*) as count FROM registrations WHERE utm_campaign IS NOT NULL AND utm_campaign != '' GROUP BY utm_campaign ORDER BY count DESC LIMIT 1`);
  const bestPlatform = await runGet(`SELECT platform, COUNT(*) as count FROM content_performance GROUP BY platform ORDER BY count DESC LIMIT 1`);
  const bestCity = byCity[0] || null;
  const bestCTA = await runGet(`SELECT share_text as cta, COUNT(*) as count FROM referral_tracking WHERE share_text IS NOT NULL GROUP BY share_text ORDER BY count DESC LIMIT 1`);
  const contentGenerated = (await runGet("SELECT COUNT(*) as c FROM content_performance"))?.c || 0;
  const contentPublished = (await runGet("SELECT COUNT(*) as c FROM content_performance WHERE status = 'published'"))?.c || 0;
  const contentPending = (await runGet("SELECT COUNT(*) as c FROM content_performance WHERE status = 'pending'"))?.c || 0;
  const contentErrors = (await runGet("SELECT COUNT(*) as c FROM content_performance WHERE status = 'error'"))?.c || 0;
  const nextExecution = await getAgentConfig("next_execution") || "Não agendado";
  const progress = Math.round((totalMembers / GOAL) * 100);
  const remaining = Math.max(0, GOAL - totalMembers);
  return {
    today: { visitors: visitorsToday, registrations: registrationsToday, whatsappClicks: whatsappClicksToday, newMembers: newMembersToday, newReferrals: newReferralsToday },
    total: { visitors: totalVisitors, registrations: totalRegistrations, whatsappClicks: totalWhatsappClicks, members: totalMembers, referrals: totalReferrals },
    funnel, byOrigin, byCity,
    champions: { bestContent: bestContent ? { title: bestContent.title, score: bestContent.score, registrations: bestContent.registrations } : null, bestCampaign: bestCampaign ? { campaign: bestCampaign.campaign, count: bestCampaign.count } : null, bestPlatform: bestPlatform ? { platform: bestPlatform.platform, count: bestPlatform.count } : null, bestCity: bestCity ? { city: bestCity.city, state: bestCity.state, count: bestCity.count } : null, bestCTA: bestCTA ? { cta: bestCTA.cta, count: bestCTA.count } : null },
    agent: { generated: contentGenerated, published: contentPublished, pending: contentPending, errors: contentErrors, nextExecution },
    goal: { target: GOAL, current: totalMembers, remaining, progress },
  };
}

export async function getAlerts() {
  const alerts: { type: string; severity: string; message: string; timestamp: string }[] = [];
  const highConversionCampaign = await runAll(`SELECT utm_campaign, COUNT(*) as count FROM registrations WHERE date(created_at) = date('now') AND utm_campaign IS NOT NULL GROUP BY utm_campaign HAVING count > 10`);
  highConversionCampaign.forEach((c: any) => { alerts.push({ type: "high_conversion", severity: "success", message: `Campanha "${c.utm_campaign}" converteu ${c.count} membros hoje!`, timestamp: new Date().toISOString() }); });
  const highTrafficPage = await runAll(`SELECT landing_page, COUNT(*) as count FROM sessions WHERE date(created_at) = date('now') GROUP BY landing_page HAVING count > 50`);
  highTrafficPage.forEach((p: any) => { alerts.push({ type: "high_traffic", severity: "info", message: `Página "${p.landing_page}" recebeu ${p.count} visitantes hoje!`, timestamp: new Date().toISOString() }); });
  const contentPerformance = await runAll(`SELECT title, whatsapp_clicks FROM content_performance WHERE date(created_at) = date('now') AND whatsapp_clicks > 5`);
  contentPerformance.forEach((c: any) => { alerts.push({ type: "content_performance", severity: "success", message: `Conteúdo "${c.title}" gerou ${c.whatsapp_clicks} cliques no WhatsApp!`, timestamp: new Date().toISOString() }); });
  const agentErrors = await runAll(`SELECT action, error_message FROM agent_logs WHERE status = 'error' AND date(created_at) = date('now') LIMIT 5`);
  agentErrors.forEach((e: any) => { alerts.push({ type: "agent_error", severity: "error", message: `Erro no agente: ${e.action} - ${e.error_message}`, timestamp: new Date().toISOString() }); });
  const yesterdayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"))?.c || 0;
  const todayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')"))?.c || 0;
  if (yesterdayMembers > 0 && todayMembers < yesterdayMembers * 0.5) {
    alerts.push({ type: "conversion_drop", severity: "warning", message: `Queda de conversão: ${todayMembers} membros hoje vs ${yesterdayMembers} ontem`, timestamp: new Date().toISOString() });
  }
  return alerts.sort((a, b) => { const o: Record<string, number> = { error: 0, warning: 1, success: 2, info: 3 }; return (o[a.severity] || 4) - (o[b.severity] || 4); });
}

export async function getChannelStatus() {
  return {
    google: await getAgentConfig("channel_google") !== "false",
    youtube: await getAgentConfig("channel_youtube") !== "false",
    tiktok: await getAgentConfig("channel_tiktok") !== "false",
    facebook: await getAgentConfig("channel_facebook") !== "false",
    instagram: await getAgentConfig("channel_instagram") !== "false",
    pinterest: await getAgentConfig("channel_pinterest") !== "false",
    reddit: await getAgentConfig("channel_reddit") !== "false",
    whatsapp: await getAgentConfig("channel_whatsapp") !== "false",
    indicacao: await getAgentConfig("channel_indicacao") !== "false",
    direto: await getAgentConfig("channel_direto") !== "false",
    outros: await getAgentConfig("channel_outros") !== "false",
  };
}

export async function toggleChannel(channel: string, enabled: boolean) {
  await setAgentConfig(`channel_${channel}`, enabled ? "true" : "false");
}

export async function addToContentQueue(data: { content_id: string; action: string; payload: string }) {
  await runExec(`INSERT OR IGNORE INTO content_queue (content_id, action, payload) VALUES (?,?,?)`, [data.content_id, data.action, data.payload]);
}

export async function processContentQueue(limit: number = 10) {
  return await runAll(`SELECT * FROM content_queue WHERE status = 'pending' AND (next_retry IS NULL OR next_retry <= datetime('now')) ORDER BY created_at ASC LIMIT ?`, [limit]);
}

export async function markQueueItemProcessed(contentId: string, status: string, error?: string) {
  if (status === "error") {
    await runExec(`UPDATE content_queue SET status = 'error', last_error = ?, attempts = attempts + 1, next_retry = datetime('now', '+1 hour'), processed_at = CURRENT_TIMESTAMP WHERE content_id = ?`, [error, contentId]);
  } else {
    await runExec(`UPDATE content_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE content_id = ?`, [status, contentId]);
  }
}

export async function getContentQueueStats() {
  const pending = (await runGet("SELECT COUNT(*) as c FROM content_queue WHERE status = 'pending'"))?.c || 0;
  const processing = (await runGet("SELECT COUNT(*) as c FROM content_queue WHERE status = 'processing'"))?.c || 0;
  const completed = (await runGet("SELECT COUNT(*) as c FROM content_queue WHERE status = 'completed'"))?.c || 0;
  const failed = (await runGet("SELECT COUNT(*) as c FROM content_queue WHERE status = 'error'"))?.c || 0;
  return { pending, processing, completed, failed };
}

export async function calculateAcquisitionScore() {
  const today = new Date().toISOString().split("T")[0];
  const platforms = await runAll(`SELECT platform, COUNT(*) as content_count, SUM(sessions) as total_sessions, SUM(registrations) as total_registrations, SUM(whatsapp_clicks) as total_whatsapp, SUM(referrals) as total_referrals FROM content_performance WHERE status = 'published' GROUP BY platform`);
  for (const p of platforms) {
    const ctr = p.total_sessions > 0 ? (p.total_whatsapp / p.total_sessions) : 0;
    const registrationRate = p.total_sessions > 0 ? (p.total_registrations / p.total_sessions) : 0;
    const whatsappRate = p.total_registrations > 0 ? (p.total_whatsapp / p.total_registrations) : 0;
    const referralRate = p.total_registrations > 0 ? (p.total_referrals / p.total_registrations) : 0;
    const membersPerContent = p.content_count > 0 ? (p.total_registrations / p.content_count) : 0;
    const score = (registrationRate * 40) + (whatsappRate * 30) + (referralRate * 20) + (membersPerContent * 10);
    await runExec(`INSERT OR REPLACE INTO acquisition_score (date, platform, impressions, clicks, registrations, whatsapp_clicks, referrals, ctr, registration_rate, whatsapp_rate, referral_rate, members_per_content, score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [today, p.platform, p.total_sessions, p.total_whatsapp, p.total_registrations, p.total_whatsapp, p.total_referrals, Math.round(ctr * 100) / 100, Math.round(registrationRate * 100) / 100, Math.round(whatsappRate * 100) / 100, Math.round(referralRate * 100) / 100, Math.round(membersPerContent * 10) / 10, Math.round(score * 10) / 10]);
  }
  const campaigns = await runAll(`SELECT utm_campaign, COUNT(*) as content_count, SUM(sessions) as total_sessions, SUM(registrations) as total_registrations, SUM(whatsapp_clicks) as total_whatsapp, SUM(referrals) as total_referrals FROM content_performance WHERE status = 'published' AND utm_campaign IS NOT NULL GROUP BY utm_campaign`);
  for (const c of campaigns) {
    const score = c.total_sessions > 0 ? ((c.total_registrations / c.total_sessions) * 100) : 0;
    await runExec(`INSERT OR REPLACE INTO acquisition_score (date, campaign, impressions, clicks, registrations, whatsapp_clicks, referrals, score) VALUES (?,?,?,?,?,?,?,?)`, [today, c.utm_campaign, c.total_sessions, c.total_whatsapp, c.total_registrations, c.total_whatsapp, c.total_referrals, Math.round(score * 10) / 10]);
  }
  return { platforms: platforms.length, campaigns: campaigns.length };
}

export async function getAcquisitionScore() {
  const today = new Date().toISOString().split("T")[0];
  const byPlatform = await runAll(`SELECT * FROM acquisition_score WHERE date = ? AND platform IS NOT NULL ORDER BY score DESC`, [today]);
  const byCampaign = await runAll(`SELECT * FROM acquisition_score WHERE date = ? AND campaign IS NOT NULL ORDER BY score DESC`, [today]);
  return { byPlatform, byCampaign, bestPlatform: byPlatform[0] || null, bestCampaign: byCampaign[0] || null };
}

export async function getAgentRecommendations() {
  const recommendations: { type: string; priority: string; action: string; reason: string; data: any }[] = [];
  const bestThemes = await runAll(`SELECT theme, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' AND theme IS NOT NULL GROUP BY theme HAVING count >= 2 ORDER BY avg_score DESC LIMIT 3`);
  bestThemes.forEach((t: any) => { recommendations.push({ type: "repeat_theme", priority: "high", action: `Repetir tema "${t.theme}"`, reason: `Score médio: ${t.avg_score.toFixed(1)} (${t.count} conteúdos)`, data: t }); });
  const badThemes = await runAll(`SELECT theme, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' AND theme IS NOT NULL GROUP BY theme HAVING count >= 2 AND avg_score < 20 ORDER BY avg_score ASC LIMIT 3`);
  badThemes.forEach((t: any) => { recommendations.push({ type: "abandon_theme", priority: "low", action: `Abandonar tema "${t.theme}"`, reason: `Score médio baixo: ${t.avg_score.toFixed(1)}`, data: t }); });
  const bestPlatforms = await runAll(`SELECT platform, AVG(score) as avg_score, COUNT(*) as count FROM content_performance WHERE status = 'published' GROUP BY platform ORDER BY avg_score DESC LIMIT 3`);
  bestPlatforms.forEach((p: any) => { recommendations.push({ type: "focus_platform", priority: "high", action: `Focar na plataforma "${p.platform}"`, reason: `Score médio: ${p.avg_score.toFixed(1)}`, data: p }); });
  const bestCTAs = await runAll(`SELECT share_text, COUNT(*) as count FROM referral_tracking WHERE share_text IS NOT NULL GROUP BY share_text ORDER BY count DESC LIMIT 3`);
  bestCTAs.forEach((c: any) => { recommendations.push({ type: "use_cta", priority: "medium", action: `Usar CTA: "${c.share_text.substring(0, 50)}..."`, reason: `${c.count} usos`, data: c }); });
  return recommendations;
}

export async function getGoalForecast() {
  const GOAL = 1000;
  const totalMembers = (await runGet("SELECT COUNT(*) as c FROM registrations"))?.c || 0;
  const last30 = await runAll(`SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day`);
  const last7 = await runAll(`SELECT date(created_at) as day, COUNT(*) as count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY day`);
  const avgDaily30 = last30.length > 0 ? last30.reduce((s: number, d: any) => s + d.count, 0) / last30.length : 0;
  const avgDaily7 = last7.length > 0 ? last7.reduce((s: number, d: any) => s + d.count, 0) / last7.length : 0;
  const todayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')"))?.c || 0;
  const yesterdayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"))?.c || 0;
  const dailyGrowth = yesterdayMembers > 0 ? ((todayMembers - yesterdayMembers) / yesterdayMembers * 100) : 0;
  const remaining = Math.max(0, GOAL - totalMembers);
  const forecastDays30 = avgDaily30 > 0 ? Math.ceil(remaining / avgDaily30) : 999;
  const forecastDays7 = avgDaily7 > 0 ? Math.ceil(remaining / avgDaily7) : 999;
  const forecastDate30 = new Date(); forecastDate30.setDate(forecastDate30.getDate() + forecastDays30);
  const forecastDate7 = new Date(); forecastDate7.setDate(forecastDate7.getDate() + forecastDays7);
  return { target: GOAL, current: totalMembers, remaining, progress: Math.round((totalMembers / GOAL) * 100), avgDaily30: Math.round(avgDaily30 * 10) / 10, avgDaily7: Math.round(avgDaily7 * 10) / 10, dailyGrowth: Math.round(dailyGrowth * 10) / 10, forecastDays30, forecastDays7, forecastDate30: forecastDate30.toISOString().split("T")[0], forecastDate7: forecastDate7.toISOString().split("T")[0], last7Days: last7, last30Days: last30 };
}

export async function getEnhancedAlerts() {
  const alerts: { type: string; severity: string; message: string; timestamp: string; data?: any }[] = [];
  const today = new Date().toISOString().split("T")[0];
  const yesterdayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now','-1 day')"))?.c || 0;
  const todayMembers = (await runGet("SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')"))?.c || 0;
  const avgDaily = (await runGet("SELECT AVG(daily_count) as avg FROM (SELECT date(created_at) as day, COUNT(*) as daily_count FROM registrations WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at))"))?.avg || 0;
  if (todayMembers > avgDaily * 2 && avgDaily > 0) alerts.push({ type: "accelerated_growth", severity: "success", message: `Crescimento acelerado: ${todayMembers} membros hoje (média: ${avgDaily.toFixed(1)})`, timestamp: new Date().toISOString() });
  if (todayMembers < avgDaily * 0.5 && avgDaily > 0) alerts.push({ type: "below_average", severity: "warning", message: `Crescimento abaixo da média: ${todayMembers} membros hoje (média: ${avgDaily.toFixed(1)})`, timestamp: new Date().toISOString() });
  const highConversionCampaigns = await runAll(`SELECT utm_campaign, COUNT(*) as count FROM registrations WHERE date(created_at) = date('now') AND utm_campaign IS NOT NULL GROUP BY utm_campaign HAVING count > 5`);
  highConversionCampaigns.forEach((c: any) => { alerts.push({ type: "winning_campaign", severity: "success", message: `Campanha vencedora: "${c.utm_campaign}" com ${c.count} membros!`, timestamp: new Date().toISOString(), data: c }); });
  const winningContent = await runAll(`SELECT title, whatsapp_clicks, registrations FROM content_performance WHERE date(created_at) = date('now') AND whatsapp_clicks > 10`);
  winningContent.forEach((c: any) => { alerts.push({ type: "winning_content", severity: "success", message: `Conteúdo vencedor: "${c.title}" com ${c.whatsapp_clicks} cliques!`, timestamp: new Date().toISOString(), data: c }); });
  const publishErrors = await runAll(`SELECT content_id, title, result FROM content_performance WHERE status = 'error' AND date(created_at) = date('now') LIMIT 5`);
  publishErrors.forEach((e: any) => { alerts.push({ type: "publish_error", severity: "error", message: `Falha ao publicar: "${e.title}" - ${e.result}`, timestamp: new Date().toISOString(), data: e }); });
  const integrationErrors = await runAll(`SELECT action, error_message FROM agent_logs WHERE status = 'error' AND date(created_at) = date('now') LIMIT 5`);
  integrationErrors.forEach((e: any) => { alerts.push({ type: "integration_error", severity: "error", message: `Falha de integração: ${e.action} - ${e.error_message}`, timestamp: new Date().toISOString(), data: e }); });
  const totalMembers = (await runGet("SELECT COUNT(*) as c FROM registrations"))?.c || 0;
  const GOAL = 1000;
  const forecastDays = avgDaily > 0 ? Math.ceil((GOAL - totalMembers) / avgDaily) : 999;
  if (forecastDays > 90 && totalMembers < GOAL) alerts.push({ type: "goal_at_risk", severity: "warning", message: `Meta em risco: previsão de ${forecastDays} dias para atingir ${GOAL} membros`, timestamp: new Date().toISOString() });
  return alerts.sort((a, b) => { const o: Record<string, number> = { error: 0, warning: 1, success: 2, info: 3 }; return (o[a.severity] || 4) - (o[b.severity] || 4); });
}

export async function getAutonomousStatus() {
  return {
    enabled: await getAgentConfig("autonomous_mode") === "true",
    lastAnalysis: await getAgentConfig("last_analysis"),
    nextAnalysis: await getAgentConfig("next_analysis"),
    actionsExecuted: parseInt(await getAgentConfig("actions_executed") || "0"),
    actionsPending: (await runGet("SELECT COUNT(*) as c FROM content_queue WHERE status = 'pending'"))?.c || 0,
    errors: (await runGet("SELECT COUNT(*) as c FROM agent_logs WHERE status = 'error' AND date(created_at) = date('now')"))?.c || 0,
    lastExecution: await getAgentConfig("last_execution"),
    executionCount: parseInt(await getAgentConfig("execution_count") || "0"),
  };
}

export async function toggleAutonomousMode(enabled: boolean) {
  await setAgentConfig("autonomous_mode", enabled ? "true" : "false");
  await createAgentLog({ agent_type: "system", action: "toggle_autonomous", details: `Modo autônomo ${enabled ? "ativado" : "desativado"}`, status: "success" });
}

export async function createTopic(data: { topic_id: string; title: string; description?: string; category: string; relevance?: number; traffic_potential?: number; conversion_potential?: number; priority?: number; tags?: string }) {
  await runExec(`INSERT OR IGNORE INTO content_topics (topic_id, title, description, category, relevance, traffic_potential, conversion_potential, priority, tags) VALUES (?,?,?,?,?,?,?,?,?)`, [data.topic_id, data.title, data.description || null, data.category, data.relevance || 50, data.traffic_potential || 50, data.conversion_potential || 50, data.priority || 50, data.tags || null]);
}

export async function getTopics(status?: string) {
  if (status) return await runAll("SELECT * FROM content_topics WHERE status = ? ORDER BY priority DESC, created_at DESC", [status]);
  return await runAll("SELECT * FROM content_topics ORDER BY priority DESC, created_at DESC");
}

export async function updateTopicStatus(topicId: string, status: string) {
  await runExec("UPDATE content_topics SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE topic_id = ?", [status, topicId]);
}

export async function createDraft(data: { draft_id: string; topic_id?: string; title: string; description?: string; body?: string; platform: string; content_type: string; cta?: string; destination_url?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string }) {
  await runExec(`INSERT INTO content_drafts (draft_id, topic_id, title, description, body, platform, content_type, cta, destination_url, utm_source, utm_medium, utm_campaign, utm_content) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [data.draft_id, data.topic_id || null, data.title, data.description || null, data.body || null, data.platform, data.content_type, data.cta || null, data.destination_url || null, data.utm_source || data.platform, data.utm_medium || "social", data.utm_campaign || "content_engine", data.utm_content || data.draft_id]);
}

export async function getDrafts(filters?: { platform?: string; status?: string; limit?: number }) {
  let query = "SELECT * FROM content_drafts WHERE 1=1";
  const params: any[] = [];
  if (filters?.platform) { query += " AND platform = ?"; params.push(filters.platform); }
  if (filters?.status) { query += " AND status = ?"; params.push(filters.status); }
  query += " ORDER BY created_at DESC";
  if (filters?.limit) { query += " LIMIT ?"; params.push(filters.limit); }
  return await runAll(query, params);
}

export async function updateDraft(draftId: string, data: Record<string, any>) {
  const allowed = ["title", "description", "body", "cta", "status", "scheduled_at", "published_at", "result", "score", "sessions", "registrations", "whatsapp_clicks", "referrals"];
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => { if (allowed.includes(key)) { updates.push(`${key} = ?`); values.push(value); } });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(draftId);
  await runExec(`UPDATE content_drafts SET ${updates.join(", ")} WHERE draft_id = ?`, values);
}

export async function getDraftStats() {
  const total = (await runGet("SELECT COUNT(*) as c FROM content_drafts"))?.c || 0;
  const byStatus = await runAll("SELECT status, COUNT(*) as count FROM content_drafts GROUP BY status ORDER BY count DESC");
  const byPlatform = await runAll("SELECT platform, COUNT(*) as count FROM content_drafts GROUP BY platform ORDER BY count DESC");
  const totalSessions = (await runGet("SELECT COALESCE(SUM(sessions), 0) as c FROM content_drafts"))?.c || 0;
  const totalRegistrations = (await runGet("SELECT COALESCE(SUM(registrations), 0) as c FROM content_drafts"))?.c || 0;
  const totalWhatsapp = (await runGet("SELECT COALESCE(SUM(whatsapp_clicks), 0) as c FROM content_drafts"))?.c || 0;
  const totalReferrals = (await runGet("SELECT COALESCE(SUM(referrals), 0) as c FROM content_drafts"))?.c || 0;
  const winners = await runAll("SELECT * FROM content_drafts WHERE status = 'vencedor' ORDER BY score DESC LIMIT 5");
  const losers = await runAll("SELECT * FROM content_drafts WHERE status = 'fraco' OR (sessions > 50 AND registrations < 2) ORDER BY score ASC LIMIT 5");
  return { total, byStatus, byPlatform, totalSessions, totalRegistrations, totalWhatsapp, totalReferrals, winners, losers };
}

export async function scheduleContent(draftId: string, scheduledFor: string) {
  const draft = await runGet("SELECT * FROM content_drafts WHERE draft_id = ?", [draftId]) as any;
  if (!draft) return null;
  const scheduleId = "SCH" + Date.now().toString(36).toUpperCase();
  await runExec(`INSERT INTO content_schedule (schedule_id, draft_id, platform, scheduled_for) VALUES (?,?,?,?)`, [scheduleId, draftId, draft.platform, scheduledFor]);
  await updateDraft(draftId, { status: "agendado", scheduled_at: scheduledFor });
  return scheduleId;
}

export async function getSchedule() {
  return await runAll(`SELECT cs.*, cd.title, cd.utm_campaign FROM content_schedule cs JOIN content_drafts cd ON cd.draft_id = cs.draft_id ORDER BY cs.scheduled_for ASC`);
}

export async function checkPlatformLimit(platform: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limitRow = await runGet("SELECT * FROM agent_limits WHERE platform = ?", [platform]) as any;
  const dailyLimit = limitRow?.daily_limit || 5;
  const today = new Date().toISOString().split("T")[0];
  const current = (await runGet("SELECT COUNT(*) as c FROM content_drafts WHERE platform = ? AND status = 'publicado' AND date(published_at) = ?", [platform, today]))?.c || 0;
  return { allowed: current < dailyLimit, current, limit: dailyLimit };
}

export async function setPlatformLimit(platform: string, dailyLimit: number) {
  await runExec("INSERT OR REPLACE INTO agent_limits (platform, daily_limit) VALUES (?,?)", [platform, dailyLimit]);
}

export async function getContentEngineDashboard() {
  const topicStats = {
    total: (await runGet("SELECT COUNT(*) as c FROM content_topics"))?.c || 0,
    active: (await runGet("SELECT COUNT(*) as c FROM content_topics WHERE status = 'active'"))?.c || 0,
    used: (await runGet("SELECT COUNT(*) as c FROM content_topics WHERE status = 'used'"))?.c || 0,
  };
  const draftStats = await getDraftStats();
  const schedule = await getSchedule();
  const platformLimits: Record<string, { allowed: boolean; current: number; limit: number }> = {};
  for (const p of ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"]) {
    platformLimits[p] = await checkPlatformLimit(p);
  }
  const recentActivity = await runAll("SELECT * FROM content_drafts ORDER BY updated_at DESC LIMIT 10");
  const topPerformers = await runAll("SELECT * FROM content_drafts WHERE sessions > 0 ORDER BY score DESC LIMIT 5");
  return { topicStats, draftStats, schedule, platformLimits, recentActivity, topPerformers };
}

export async function generateContentForTopic(topicId: string, platform: string) {
  const topic = await runGet("SELECT * FROM content_topics WHERE topic_id = ?", [topicId]) as any;
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
  await createDraft({ draft_id: draftId, topic_id: topicId, title: template.title, description: topic.description, body: template.body, platform, content_type: template.content_type, cta: template.cta, destination_url: "https://equipe-ademilson.vercel.app", utm_source: platform, utm_medium: "social", utm_campaign: utmCampaign, utm_content: utmContent });
  return draftId;
}

export async function calculateWeightedScore() {
  const minData = parseInt(await getAgentConfig("min_data_threshold") || "5");
  const byTheme = await runAll(`SELECT cd.topic_id, ct.title as theme, COUNT(*) as content_count, COALESCE(SUM(cd.sessions), 0) as total_sessions, COALESCE(SUM(cd.registrations), 0) as total_registrations, COALESCE(SUM(cd.whatsapp_clicks), 0) as total_whatsapp, COALESCE(SUM(cd.referrals), 0) as total_referrals FROM content_drafts cd LEFT JOIN content_topics ct ON ct.topic_id = cd.topic_id WHERE cd.status IN ('publicado', 'medindo', 'vencedor') GROUP BY cd.topic_id HAVING content_count >= ? ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC`, [minData]);
  const byPlatform = await runAll(`SELECT platform, COUNT(*) as content_count, COALESCE(SUM(sessions), 0) as total_sessions, COALESCE(SUM(registrations), 0) as total_registrations, COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp, COALESCE(SUM(referrals), 0) as total_referrals FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor') GROUP BY platform HAVING content_count >= ? ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC`, [minData]);
  const byCampaign = await runAll(`SELECT utm_campaign, COUNT(*) as content_count, COALESCE(SUM(sessions), 0) as total_sessions, COALESCE(SUM(registrations), 0) as total_registrations, COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp, COALESCE(SUM(referrals), 0) as total_referrals FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor') AND utm_campaign IS NOT NULL GROUP BY utm_campaign HAVING content_count >= ? ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC`, [minData]);
  const byCTA = await runAll(`SELECT cta, COUNT(*) as content_count, COALESCE(SUM(sessions), 0) as total_sessions, COALESCE(SUM(registrations), 0) as total_registrations, COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp, COALESCE(SUM(referrals), 0) as total_referrals FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor') AND cta IS NOT NULL AND cta != '' GROUP BY cta HAVING content_count >= ? ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC`, [minData]);
  const byLandingPage = await runAll(`SELECT destination_url as landing_page, COUNT(*) as content_count, COALESCE(SUM(sessions), 0) as total_sessions, COALESCE(SUM(registrations), 0) as total_registrations, COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp, COALESCE(SUM(referrals), 0) as total_referrals FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor') AND destination_url IS NOT NULL GROUP BY destination_url HAVING content_count >= ? ORDER BY total_referrals DESC, total_whatsapp DESC, total_registrations DESC`, [minData]);
  const scored = (items: any[]) => items.map(item => {
    const members = item.total_referrals || 0;
    const whatsapp = item.total_whatsapp || 0;
    const registrations = item.total_registrations || 0;
    const visitors = item.total_sessions || 0;
    const totalScore = (members * 40) + (whatsapp * 30) + (registrations * 20) + (visitors * 10);
    return { ...item, score: Math.round(totalScore * 10) / 10, member_rate: visitors > 0 ? Math.round((members / visitors) * 100) / 100 : 0, whatsapp_rate: registrations > 0 ? Math.round((whatsapp / registrations) * 100) / 100 : 0, conversion_rate: visitors > 0 ? Math.round((registrations / visitors) * 100) / 100 : 0 };
  });
  return { byTheme: scored(byTheme), byPlatform: scored(byPlatform), byCampaign: scored(byCampaign), byCTA: scored(byCTA), byLandingPage: scored(byLandingPage), minDataThreshold: minData, hasEnoughData: byTheme.length > 0 || byPlatform.length > 0 };
}

export async function getLearningInsights() {
  const score = await calculateWeightedScore();
  const minData = parseInt(await getAgentConfig("min_data_threshold") || "5");
  const insights: { type: string; priority: string; insight: string; data: any }[] = [];
  if (score.byTheme.length > 0) {
    const best = score.byTheme[0];
    insights.push({ type: "best_theme", priority: "high", insight: `Melhor tema: "${best.theme}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`, data: best });
    if (score.byTheme.length > 1) {
      const worst = score.byTheme[score.byTheme.length - 1];
      if (worst.score < best.score * 0.3) insights.push({ type: "theme_gap", priority: "medium", insight: `Tema "${worst.theme}" tem score ${worst.score}x menor que "${best.theme}". Considere abandonar.`, data: worst });
    }
  }
  if (score.byPlatform.length > 0) {
    const best = score.byPlatform[0];
    insights.push({ type: "best_platform", priority: "high", insight: `Melhor plataforma: "${best.platform}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`, data: best });
    if (score.byPlatform.length > 1) {
      const second = score.byPlatform[1];
      insights.push({ type: "platform_comparison", priority: "medium", insight: `2ª melhor plataforma: "${second.platform}" com score ${second.score} vs ${best.score} (${best.platform})`, data: second });
    }
  }
  if (score.byCampaign.length > 0) {
    const best = score.byCampaign[0];
    insights.push({ type: "best_campaign", priority: "high", insight: `Melhor campanha: "${best.utm_campaign}" com ${best.total_referrals} membros, ${best.total_whatsapp} cliques WhatsApp e score ${best.score}`, data: best });
  }
  if (score.byCTA.length > 0) {
    const best = score.byCTA[0];
    insights.push({ type: "best_cta", priority: "high", insight: `Melhor CTA: "${best.cta}" com ${best.total_referrals} membros e score ${best.score}`, data: best });
  }
  if (score.byLandingPage.length > 0) {
    const best = score.byLandingPage[0];
    insights.push({ type: "best_landing_page", priority: "high", insight: `Melhor landing page: "${best.landing_page}" com ${best.total_referrals} membros e score ${best.score}`, data: best });
  }
  const totalDrafts = (await runGet("SELECT COUNT(*) as c FROM content_drafts"))?.c || 0;
  const publishedDrafts = (await runGet("SELECT COUNT(*) as c FROM content_drafts WHERE status IN ('publicado', 'medindo', 'vencedor')"))?.c || 0;
  if (publishedDrafts < minData) insights.push({ type: "insufficient_data", priority: "warning", insight: `Dados insuficientes: ${publishedDrafts}/${minData} conteúdos publicados. Necessário mais dados para decisões automáticas.`, data: { published: publishedDrafts, required: minData } });
  const losers = await runAll(`SELECT * FROM content_drafts WHERE status IN ('publicado', 'medindo') AND sessions > 20 AND registrations < 2 ORDER BY sessions DESC LIMIT 5`);
  losers.forEach((l: any) => { insights.push({ type: "low_performance", priority: "low", insight: `"${l.title}" tem ${l.sessions} visitantes mas apenas ${l.registrations} cadastros. Considere pausar.`, data: l }); });
  const winners = await runAll(`SELECT * FROM content_drafts WHERE status IN ('publicado', 'medindo') AND referrals > 0 ORDER BY referrals DESC LIMIT 3`);
  winners.forEach((w: any) => { insights.push({ type: "winner_content", priority: "high", insight: `"${w.title}" gerou ${w.referrals} membros! Potencial de replicação.`, data: w }); });
  return { insights, score, hasEnoughData: score.hasEnoughData, minDataThreshold: minData };
}

export async function getAgentMode() {
  const paused = await getAgentConfig("acquisition_paused") === "true";
  const autonomous = await getAgentConfig("agent_mode") === "autonomous";
  const mode = paused ? "paused" : autonomous ? "autonomous" : "test";
  return { mode, testMode: !autonomous && !paused, autonomousMode: autonomous, paused, minDataThreshold: parseInt(await getAgentConfig("min_data_threshold") || "5") };
}

export async function setAgentMode(mode: "test" | "autonomous" | "paused") {
  if (mode === "paused") {
    await setAgentConfig("acquisition_paused", "true");
  } else {
    await setAgentConfig("acquisition_paused", "false");
    await setAgentConfig("agent_mode", mode);
  }
  await createAgentLog({ agent_type: "content_engine", action: "set_mode", details: `Modo alterado para: ${mode}`, status: "success" });
}

export async function setMinDataThreshold(threshold: number) {
  await setAgentConfig("min_data_threshold", threshold.toString());
}

export async function createCampaignContent(data: { campaign_id: string; content_index: number; platform: string; title: string; body?: string; cta?: string; url?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string }) {
  await runExec(`INSERT INTO campaign_contents (campaign_id, content_index, platform, title, body, cta, url, utm_source, utm_medium, utm_campaign, utm_content) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [data.campaign_id, data.content_index, data.platform, data.title, data.body || null, data.cta || null, data.url || null, data.utm_source || data.platform, data.utm_medium || "organic", data.utm_campaign || "primeiro-100-membros", data.utm_content || null]);
}

export async function getCampaignContents(campaignId: string) {
  return await runAll("SELECT * FROM campaign_contents WHERE campaign_id = ? ORDER BY content_index ASC, platform ASC", [campaignId]);
}

export async function getCampaignStats(campaignId: string) {
  const contents = await runAll("SELECT * FROM campaign_contents WHERE campaign_id = ?", [campaignId]) as any[];
  const totalContents = contents.length;
  const published = contents.filter((c: any) => c.status === "publicado").length;
  const ready = contents.filter((c: any) => c.status === "pronto").length;
  const measuring = contents.filter((c: any) => c.status === "medindo").length;
  const totalSessions = contents.reduce((s: number, c: any) => s + (c.sessions || 0), 0);
  const totalRegistrations = contents.reduce((s: number, c: any) => s + (c.registrations || 0), 0);
  const totalWhatsapp = contents.reduce((s: number, c: any) => s + (c.whatsapp_clicks || 0), 0);
  const totalReferrals = contents.reduce((s: number, c: any) => s + (c.referrals || 0), 0);
  const byPlatform: Record<string, any> = {};
  for (const c of contents) {
    if (!byPlatform[c.platform]) byPlatform[c.platform] = { platform: c.platform, count: 0, sessions: 0, registrations: 0, whatsapp_clicks: 0, referrals: 0, published: 0 };
    byPlatform[c.platform].count++;
    byPlatform[c.platform].sessions += c.sessions || 0;
    byPlatform[c.platform].registrations += c.registrations || 0;
    byPlatform[c.platform].whatsapp_clicks += c.whatsapp_clicks || 0;
    byPlatform[c.platform].referrals += c.referrals || 0;
    if (c.status === "publicado") byPlatform[c.platform].published++;
  }
  const byContent: Record<number, any> = {};
  for (const c of contents) {
    if (!byContent[c.content_index]) byContent[c.content_index] = { content_index: c.content_index, title: c.title, sessions: 0, registrations: 0, whatsapp_clicks: 0, referrals: 0, platforms: 0 };
    byContent[c.content_index].sessions += c.sessions || 0;
    byContent[c.content_index].registrations += c.registrations || 0;
    byContent[c.content_index].whatsapp_clicks += c.whatsapp_clicks || 0;
    byContent[c.content_index].referrals += c.referrals || 0;
    byContent[c.content_index].platforms++;
  }
  const bestContent = Object.values(byContent).sort((a: any, b: any) => b.referrals - a.referrals || b.whatsapp_clicks - a.whatsapp_clicks)[0] || null;
  const bestPlatform = Object.values(byPlatform).sort((a: any, b: any) => b.referrals - a.referrals || b.whatsapp_clicks - a.whatsapp_clicks)[0] || null;
  const bestCTA = await runGet(`SELECT cta, SUM(referrals) as referrals, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(registrations) as registrations FROM campaign_contents WHERE campaign_id = ? AND cta IS NOT NULL GROUP BY cta ORDER BY referrals DESC, whatsapp_clicks DESC LIMIT 1`, [campaignId]);
  const bestLandingPage = await runGet(`SELECT url as landing_page, SUM(referrals) as referrals, SUM(whatsapp_clicks) as whatsapp_clicks, SUM(registrations) as registrations FROM campaign_contents WHERE campaign_id = ? AND url IS NOT NULL GROUP BY url ORDER BY referrals DESC, whatsapp_clicks DESC LIMIT 1`, [campaignId]);
  return { campaign_id: campaignId, totalContents, published, ready, measuring, totalSessions, totalRegistrations, totalWhatsapp, totalReferrals, conversionRate: totalSessions > 0 ? Math.round((totalRegistrations / totalSessions) * 100) : 0, whatsappRate: totalRegistrations > 0 ? Math.round((totalWhatsapp / totalRegistrations) * 100) : 0, memberRate: totalWhatsapp > 0 ? Math.round((totalReferrals / totalWhatsapp) * 100) : 0, byPlatform: Object.values(byPlatform), byContent: Object.values(byContent), bestContent, bestPlatform, bestCTA, bestLandingPage };
}

export async function updateCampaignContent(campaignId: string, contentIndex: number, platform: string, data: Record<string, any>) {
  const allowed = ["status", "sessions", "registrations", "whatsapp_clicks", "referrals", "score", "published_at"];
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => { if (allowed.includes(key)) { updates.push(`${key} = ?`); values.push(value); } });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(campaignId, contentIndex, platform);
  await runExec(`UPDATE campaign_contents SET ${updates.join(", ")} WHERE campaign_id = ? AND content_index = ? AND platform = ?`, values);
}

export async function seedPrimeiraCampanha() {
  const campaignId = "primeiro-100-membros";
  const SITE_URL = "https://equipe-ademilson.vercel.app";
  const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";
  const contents = [
    { index: 1, platform: "youtube", title: "O que SÃO os Vídeos para Treinamento de IA? (Explicação Completa)", body: "Neste vídeo, explicamos o que são os vídeos para treinamento de inteligência artificial, por que empresas pagam por eles e como você pode participar gravando vídeos do dia a dia.", cta: "Link na descrição para entrar no grupo", utm_content: "video-01-youtube" },
    { index: 1, platform: "tiktok", title: "O que são os Vídeos para IA em 60 Segundos", body: "Você sabia que a IA precisa de vídeos reais para aprender? Grave do dia a dia e ganhe em dólar. Explico em 60 segundos.", cta: "Link na bio", utm_content: "video-01-tiktok" },
    { index: 1, platform: "instagram", title: "🤖 O que são Vídeos para Treinamento de IA?", body: "A inteligência artificial precisa assistir vídeos reais para aprender. E você pode ganhar dinheiro gravando esses vídeos. Salve para consultar depois!", cta: "Link na bio para saber mais", utm_content: "video-01-instagram" },
    { index: 1, platform: "facebook", title: "Você Sabia que a IA Precisa de Vídeos para Aprender?", body: "Empresas de tecnologia precisam de vídeos reais do dia a dia para treinar seus sistemas de IA. E pagam por isso. Saiba como funciona.", cta: "Clique no link para entrar no grupo", utm_content: "video-01-facebook" },
    { index: 1, platform: "pinterest", title: "O que são Vídeos para Treinamento de IA — Guia Completo", body: "Descubra o que são os vídeos para treinamento de IA, como funcionam e por que estão se tornando uma oportunidade de renda extra.", cta: "Saiba mais no site", utm_content: "video-01-pinterest" },
    { index: 1, platform: "reddit", title: "[Discussão] Alguém pode explicar o que são vídeos para treinamento de IA?", body: "Estou vendo muita gente falando sobre gravar vídeos para treinar IA. Alguém pode explicar como funciona na prática? Quero entender melhor antes de participar.", cta: "Mais informações no link", utm_content: "video-01-reddit" },
    { index: 2, platform: "youtube", title: "Como Funciona a PARTICIPAÇÃO no Projeto de Vídeos para IA (Passo a Passo)", body: "Neste vídeo, mostramos como funciona a participação no projeto: desde o cadastro até a gravação dos primeiros vídeos. Tudo explicado passo a passo.", cta: "Link na descrição para começar", utm_content: "video-02-youtube" },
    { index: 2, platform: "tiktok", title: "Passo a Passo para Participar do Projeto de IA", body: "1. Entre no grupo. 2. Faça o cadastro. 3. Grave vídeos do dia a dia. 4. Ganhe em dólar. Simples assim!", cta: "Link na bio para começar", utm_content: "video-02-tiktok" },
    { index: 2, platform: "instagram", title: "📸 Como Participar do Projeto — Passo a Passo", body: "Passo 1: Entre no grupo WhatsApp.\nPasso 2: Faça seu cadastro.\nPasso 3: Grave vídeos do dia a dia.\nPasso 4: Receba em dólar.\n\nSalve esse post!", cta: "Link na bio para começar", utm_content: "video-02-instagram" },
    { index: 2, platform: "facebook", title: "Como Participar: 4 Passos Simples para Ganhar com Vídeos para IA", body: "1. Entre no nosso grupo WhatsApp gratuito.\n2. Faça seu cadastro rápido.\n3. Grave vídeos do seu dia a dia.\n4. Receba seus ganhos em dólar.\n\nNão precisa de experiência prévia.", cta: "Entre no grupo pelo link", utm_content: "video-02-facebook" },
    { index: 2, platform: "pinterest", title: "Guia: Como Participar do Projeto de Gravação para IA", body: "Passo a passo completo para começar a gravar vídeos para treinamento de IA. Do cadastro à primeira gravação.", cta: "Saiba mais no site", utm_content: "video-02-pinterest" },
    { index: 2, platform: "reddit", title: "Guia: Como começar a gravar vídeos para treinamento de IA", body: "Fiz um resumo do processo: cadastro no grupo, gravação de vídeos do dia a dia, envio e pagamento. Alguém já participou? Como foi a experiência?", cta: "Link para mais detalhes", utm_content: "video-02-reddit" },
    { index: 3, platform: "youtube", title: "Quem PODE Participar? (Requisitos para Gravar Vídeos para IA)", body: "Neste vídeo, explicamos quem pode participar do projeto. Spoiler: se você tem um smartphone e sabe gravar um vídeo, já pode começar.", cta: "Link na descrição para se inscrever", utm_content: "video-03-youtube" },
    { index: 3, platform: "tiktok", title: "Você Pode Participar? Veja os Requisitos", body: "Precisa de smartphone? Sim. Precisa de experiência? Não. Precisa de setup profissional? Também não. Veja se você se encaixa.", cta: "Link na bio", utm_content: "video-03-tiktok" },
    { index: 3, platform: "instagram", title: "👤 Quem Pode Participar do Projeto?", body: "✅ Tem smartphone\n✅ Sabe gravar um vídeo\n✅ Quer ganhar dinheiro extra\n\nNão precisa de experiência. Não precisa de equipamento profissional.\n\nMarque um amigo que se encaixa!", cta: "Link na bio para se inscrever", utm_content: "video-03-instagram" },
    { index: 3, platform: "facebook", title: "Quem Pode Participar? Veja os Requisitos Simples", body: "Para participar, você precisa apenas de:\n• Um smartphone\n• Vontade de aprender\n• 10-15 minutos por dia\n\nNão precisa de experiência prévia. Não precisa de equipamento profissional.", cta: "Entre no grupo e descubra", utm_content: "video-03-facebook" },
    { index: 3, platform: "pinterest", title: "Quem Pode Participar do Projeto de Vídeos para IA?", body: "Requisitos simples: smartphone, vontade de aprender e disponibilidade. Não precisa de experiência. Veja os detalhes completos.", cta: "Saiba mais", utm_content: "video-03-pinterest" },
    { index: 3, platform: "reddit", title: "Requisitos para participar do projeto de gravação de vídeos para IA", body: "Vi que precisa basicamente de smartphone e cadastro no grupo. Alguém sabe se aceita pessoas de qualquer estado? Como funciona a verificação dos vídeos?", cta: "Link para os requisitos completos", utm_content: "video-03-reddit" },
    { index: 4, platform: "youtube", title: "QUANTO GANHA quem Grava Vídeos para IA? (Valores Reais, Sem Mito)", body: "Neste vídeo, falamos sobre quanto é possível ganhar gravando vídeos para treinamento de IA. Importante: valores são estimativas e NÃO são garantia de ganho.", cta: "Link na descrição para começar", utm_content: "video-04-youtube" },
    { index: 4, platform: "tiktok", title: "Quanto Ganha? (Sem Mito, Sem Garantia)", body: "Valores variam muito. Não é garantia. Mas mostramos o que as pessoas estão conseguindo. Lembre: resultados não são garantidos.", cta: "Link na bio para saber mais", utm_content: "video-04-tiktok" },
    { index: 4, platform: "instagram", title: "💰 Quanto é Possível Ganhar? (Valores Estimados)", body: "⚠️ ATENÇÃO: Valores são estimativas. NÃO são garantia de ganho.\n\nMostramos a faixa estimada para você ter uma ideia. Cada pessoa tem um resultado diferente.\n\nSalve para não esquecer!", cta: "Link na bio para detalhes", utm_content: "video-04-instagram" },
    { index: 4, platform: "facebook", title: "Quanto Ganha quem Grava Vídeos para IA? (Valores Estimados)", body: "Importante: valores são estimativas e NÃO são garantia.\n\nMostramos a faixa estimada para você ter uma ideia do potencial. Cada pessoa tem um resultado diferente dependendo de vários fatores.", cta: "Saiba mais no grupo", utm_content: "video-04-facebook" },
    { index: 4, platform: "pinterest", title: "Quanto Ganha quem Grava Vídeos para IA? (Estimativas)", body: "Valores estimados — não são garantia. Veja a faixa de ganho potencial e entenda os fatores que influenciam seus resultados.", cta: "Ver detalhes no site", utm_content: "video-04-pinterest" },
    { index: 4, platform: "reddit", title: "Quanto é possível ganhar gravando vídeos para IA? (sem hype)", body: "Quero dados reais, sem exagero. Alguém que já participa pode compartilhar quanto conseguiu ganhar? Valores estimados ou reais. Sem promessas.", cta: "Link para ver estimativas", utm_content: "video-04-reddit" },
    { index: 5, platform: "youtube", title: "COMO ENTRAR e Começar Agora (Grupo WhatsApp + Cadastro)", body: "Neste vídeo, mostramos exatamente como entrar no grupo WhatsApp, fazer seu cadastro e começar a gravar seus primeiros vídeos para IA.", cta: "Link na descrição — entre agora", utm_content: "video-05-youtube" },
    { index: 5, platform: "tiktok", title: "Como Começar AGORA (3 Passos Rápidos)", body: "1. Clica no link da bio. 2. Entra no grupo WhatsApp. 3. Faz o cadastro. Pronto, já pode começar!", cta: "Link na bio — comece agora", utm_content: "video-05-tiktok" },
    { index: 5, platform: "instagram", title: "🚀 Como Começar Agora — 3 Passos", body: "1️⃣ Clique no link da bio\n2️⃣ Entre no grupo WhatsApp gratuito\n3️⃣ Faça seu cadastro\n\nEm menos de 5 minutos você está dentro.\n\nMarque quem precisa de renda extra!", cta: "Link na bio — comece agora", utm_content: "video-05-instagram" },
    { index: 5, platform: "facebook", title: "Como Começar a Ganhar com Vídeos para IA (Guia Rápido)", body: "Passo 1: Entre no nosso grupo WhatsApp (link nos comentários).\nPasso 2: Faça seu cadastro gratuito.\nPasso 3: Assista o tutorial e grave seu primeiro vídeo.\n\nComece hoje mesmo!", cta: "Entre no grupo pelo link", utm_content: "video-05-facebook" },
    { index: 5, platform: "pinterest", title: "Como Começar a Gravar Vídeos para IA — Guia Rápido", body: "Guia passo a passo: como entrar no grupo, fazer cadastro e começar a gravar seus primeiros vídeos para treinamento de IA.", cta: "Comece agora no site", utm_content: "video-05-pinterest" },
    { index: 5, platform: "reddit", title: "Como começar: guia rápido para gravar vídeos para IA", body: "Resumo rápido: entre no grupo WhatsApp (link), faça o cadastro e comece a gravar. Alguém tem dicas para iniciantes? Quero começar mas não sei por onde.", cta: "Link para começar", utm_content: "video-05-reddit" },
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
    await createCampaignContent({ campaign_id: campaignId, content_index: c.index, platform: c.platform, title: c.title, body: c.body, cta: c.cta, url: finalUrl, utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_content: utmContent });
    created++;
  }
  await createAgentLog({ agent_type: "content_engine", action: "seed_campaign", details: `Campanha "${campaignId}" criada com ${created} conteúdos`, status: "success" });
  return { campaign_id: campaignId, created };
}

export interface PublicationItem {
  id: number; campaign_id: string; content_id: string; platform: string; title: string; content: string;
  media_url: string | null; destination_url: string | null; utm_source: string | null; utm_medium: string | null;
  utm_campaign: string | null; utm_content: string | null; scheduled_at: string; status: string;
  published_at: string | null; external_post_id: string | null; error_message: string | null;
  retry_count: number; max_retries: number; created_at: string; updated_at: string;
}

export async function addToPublicationQueue(data: { campaign_id: string; content_id: string; platform: string; title: string; content: string; media_url?: string; destination_url?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; scheduled_at: string; status?: string }): Promise<PublicationItem> {
  await runExec(`INSERT INTO publication_queue (campaign_id, content_id, platform, title, content, media_url, destination_url, utm_source, utm_medium, utm_campaign, utm_content, scheduled_at, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [data.campaign_id, data.content_id, data.platform, data.title, data.content, data.media_url || null, data.destination_url || null, data.utm_source || data.platform, data.utm_medium || "organic", data.utm_campaign || "primeiro-100-membros", data.utm_content || null, data.scheduled_at, data.status || "draft"]);
  return await runGet("SELECT * FROM publication_queue WHERE id = last_insert_rowid()") as PublicationItem;
}

export async function getPublicationQueue(filters?: { status?: string; platform?: string; campaign_id?: string; limit?: number; offset?: number }): Promise<PublicationItem[]> {
  let query = "SELECT * FROM publication_queue WHERE 1=1";
  const params: any[] = [];
  if (filters?.status) { query += " AND status = ?"; params.push(filters.status); }
  if (filters?.platform) { query += " AND platform = ?"; params.push(filters.platform); }
  if (filters?.campaign_id) { query += " AND campaign_id = ?"; params.push(filters.campaign_id); }
  query += " ORDER BY scheduled_at ASC";
  if (filters?.limit) { query += " LIMIT ?"; params.push(filters.limit); }
  if (filters?.offset) { query += " OFFSET ?"; params.push(filters.offset); }
  return await runAll(query, params) as PublicationItem[];
}

export async function getPublicationQueueStats() {
  const today = new Date().toISOString().split("T")[0];
  return {
    total: (await runGet("SELECT COUNT(*) as c FROM publication_queue"))?.c || 0,
    draft: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'draft'"))?.c || 0,
    approved: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'approved'"))?.c || 0,
    scheduled: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'scheduled'"))?.c || 0,
    publishing: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'publishing'"))?.c || 0,
    published: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'published'"))?.c || 0,
    failed: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'failed'"))?.c || 0,
    paused: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'paused'"))?.c || 0,
    publishedToday: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'published' AND date(published_at) = ?", [today]))?.c || 0,
    scheduledUpcoming: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'scheduled' AND scheduled_at > datetime('now')"))?.c || 0,
    retryPending: (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE status = 'failed' AND retry_count < max_retries"))?.c || 0,
    byPlatform: await runAll(`SELECT platform, COUNT(*) as total, SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled FROM publication_queue GROUP BY platform ORDER BY total DESC`),
  };
}

export async function updatePublicationQueue(id: number, data: Partial<{ status: string; published_at: string; external_post_id: string; error_message: string; retry_count: number; scheduled_at: string }>) {
  const allowed = ["status", "published_at", "external_post_id", "error_message", "retry_count", "scheduled_at"];
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => { if (allowed.includes(key)) { updates.push(`${key} = ?`); values.push(value); } });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  await runExec(`UPDATE publication_queue SET ${updates.join(", ")} WHERE id = ?`, values);
}

export async function getPendingPublications(): Promise<PublicationItem[]> {
  return await runAll(`SELECT * FROM publication_queue WHERE status IN ('approved', 'scheduled') AND scheduled_at <= datetime('now') ORDER BY scheduled_at ASC`) as PublicationItem[];
}

export async function getFailedRetries(): Promise<PublicationItem[]> {
  return await runAll(`SELECT * FROM publication_queue WHERE status = 'failed' AND retry_count < max_retries AND (next_retry IS NULL OR next_retry <= datetime('now')) ORDER BY retry_count ASC, scheduled_at ASC`) as PublicationItem[];
}

export async function markAsPublished(id: number, externalPostId: string) {
  await updatePublicationQueue(id, { status: "published", published_at: new Date().toISOString(), external_post_id: externalPostId, error_message: undefined });
}

export async function markAsFailed(id: number, error: string) {
  const item = await runGet("SELECT retry_count, max_retries FROM publication_queue WHERE id = ?", [id]) as any;
  if (!item) return;
  const newRetryCount = item.retry_count + 1;
  const nextRetry = newRetryCount < item.max_retries ? new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 60 * 1000).toISOString() : null;
  await updatePublicationQueue(id, { status: newRetryCount >= item.max_retries ? "failed" : "scheduled", error_message: error, retry_count: newRetryCount, scheduled_at: nextRetry || undefined });
}

export async function deletePublicationQueueItem(id: number) {
  await runExec("DELETE FROM publication_queue WHERE id = ?", [id]);
}

export async function isDuplicatePublication(contentId: string, platform: string): Promise<boolean> {
  const row = await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE content_id = ? AND platform = ? AND status = 'published'", [contentId, platform]);
  return (row?.c || 0) > 0;
}

export async function getPlatformConfig(platform: string) {
  return await runGet("SELECT * FROM platform_config WHERE platform = ?", [platform]);
}

export async function getAllPlatformConfigs() {
  return await runAll("SELECT * FROM platform_config ORDER BY platform ASC");
}

export async function upsertPlatformConfig(platform: string, data: Partial<{ api_configured: number; api_token: string; api_secret: string; api_key: string; daily_limit: number; enabled: number }>) {
  const existing = await runGet("SELECT id FROM platform_config WHERE platform = ?", [platform]) as any;
  if (existing) {
    const updates: string[] = [];
    const values: any[] = [];
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined) { updates.push(`${key} = ?`); values.push(value); } });
    if (updates.length === 0) return;
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(platform);
    await runExec(`UPDATE platform_config SET ${updates.join(", ")} WHERE platform = ?`, values);
  } else {
    await runExec(`INSERT INTO platform_config (platform, api_configured, api_token, api_secret, api_key, daily_limit, enabled) VALUES (?,?,?,?,?,?,?)`, [platform, data.api_configured || 0, data.api_token || null, data.api_secret || null, data.api_key || null, data.daily_limit || 3, data.enabled !== undefined ? data.enabled : 1]);
  }
}

export async function seedPlatformConfigs() {
  const platforms = [
    { platform: "youtube", daily_limit: 2 }, { platform: "tiktok", daily_limit: 3 },
    { platform: "instagram", daily_limit: 3 }, { platform: "facebook", daily_limit: 3 },
    { platform: "pinterest", daily_limit: 5 }, { platform: "reddit", daily_limit: 2 },
  ];
  for (const p of platforms) {
    const existing = await getPlatformConfig(p.platform);
    if (!existing) await upsertPlatformConfig(p.platform, { daily_limit: p.daily_limit, enabled: 1 });
  }
}

export async function checkPlatformDailyLimit(platform: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const today = new Date().toISOString().split("T")[0];
  const config = await getPlatformConfig(platform) as any;
  const limit = config?.daily_limit || 3;
  const current = (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE platform = ? AND status = 'published' AND date(published_at) = ?", [platform, today]))?.c || 0;
  return { allowed: current < limit, current, limit };
}

export async function getAutomationStatus() {
  const mode = await getAgentMode();
  const queueStats = await getPublicationQueueStats();
  const platforms = await getAllPlatformConfigs();
  const platformStatus = [];
  for (const p of platforms) {
    const todayUsage = (await runGet("SELECT COUNT(*) as c FROM publication_queue WHERE platform = ? AND status = 'published' AND date(published_at) = date('now')", [p.platform]))?.c || 0;
    platformStatus.push({
      platform: p.platform, api_configured: p.api_configured === 1, enabled: p.enabled === 1,
      daily_limit: p.daily_limit, total_published: p.total_published || 0, total_errors: p.total_errors || 0,
      last_publish: p.last_publish, today_usage: todayUsage,
    });
  }
  return {
    mode: mode.mode, test_mode: mode.mode === "test", autonomous_mode: mode.mode === "autonomous", paused_mode: mode.mode === "paused",
    queue: queueStats, platforms: platformStatus,
    last_cron_run: await getAgentConfig("cron_last_run"), next_cron_run: await getAgentConfig("cron_next_run"),
  };
}

// === SOCIAL ACCOUNTS ===

export async function getSocialAccounts(platform?: string) {
  if (platform) {
    return await runAll("SELECT * FROM social_accounts WHERE platform = ? ORDER BY connected_at DESC", [platform]);
  }
  return await runAll("SELECT * FROM social_accounts ORDER BY platform ASC, connected_at DESC");
}

export async function getSocialAccountsByPlatform() {
  const accounts = await runAll("SELECT * FROM social_accounts ORDER BY platform ASC");
  const grouped: Record<string, any[]> = {};
  for (const a of accounts) {
    if (!grouped[a.platform]) grouped[a.platform] = [];
    grouped[a.platform].push(a);
  }
  return grouped;
}

export async function getSocialAccount(id: number) {
  return await runGet("SELECT * FROM social_accounts WHERE id = ?", [id]);
}

export async function getSocialAccountByPlatformAccount(platform: string, accountId: string) {
  return await runGet("SELECT * FROM social_accounts WHERE platform = ? AND account_id = ?", [platform, accountId]);
}

export async function createSocialAccount(data: {
  platform: string;
  account_name: string;
  account_id?: string;
  avatar_url?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  scopes?: string;
  status?: string;
}) {
  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO social_accounts (platform, account_name, account_id, avatar_url, access_token, refresh_token, expires_at, scopes, status, connected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [data.platform, data.account_name, data.account_id || null, data.avatar_url || null,
     data.access_token || null, data.refresh_token || null, data.expires_at || null,
     data.scopes || null, data.status || 'connected'],
  });
  return Number(result.lastInsertRowid);
}

export async function updateSocialAccount(id: number, data: Partial<{
  account_name: string;
  avatar_url: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string;
  status: string;
  error_message: string;
}>) {
  const updates: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });
  if (updates.length === 0) return;
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  await runExec(`UPDATE social_accounts SET ${updates.join(", ")} WHERE id = ?`, values);
}

export async function deleteSocialAccount(id: number) {
  await runExec("DELETE FROM social_accounts WHERE id = ?", [id]);
}

export async function getSocialConnectionStatus() {
  const platforms = ["youtube", "instagram", "facebook", "tiktok", "pinterest", "reddit"];
  const result = [];
  for (const platform of platforms) {
    const accounts = await runAll("SELECT id, account_name, status, connected_at, avatar_url FROM social_accounts WHERE platform = ? AND status = 'connected'", [platform]);
    const config = await getPlatformConfig(platform);
    result.push({
      platform,
      connected: accounts.length > 0,
      accounts,
      api_configured: config?.api_configured === 1,
      daily_limit: config?.daily_limit || 0,
    });
  }
  return result;
}

// === PUBLICATION LOG ===

export async function logPublication(data: {
  queue_item_id?: number;
  platform: string;
  account_id?: string;
  campaign_id?: string;
  content_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  scheduled_at?: string;
  published_at?: string;
  external_post_id?: string;
  status?: string;
  error_message?: string;
  response_data?: string;
}) {
  await runExec(
    `INSERT INTO publication_log (queue_item_id, platform, account_id, campaign_id, content_id, utm_source, utm_medium, utm_campaign, utm_content, scheduled_at, published_at, external_post_id, status, error_message, response_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.queue_item_id || null, data.platform, data.account_id || null,
     data.campaign_id || null, data.content_id || null,
     data.utm_source || null, data.utm_medium || null, data.utm_campaign || null, data.utm_content || null,
     data.scheduled_at || null, data.published_at || null, data.external_post_id || null,
     data.status || 'pending', data.error_message || null, data.response_data || null]
  );
}

export async function getPublicationLog(filters?: { platform?: string; status?: string; limit?: number }) {
  let sql = "SELECT * FROM publication_log";
  const conditions: string[] = [];
  const values: any[] = [];
  if (filters?.platform) { conditions.push("platform = ?"); values.push(filters.platform); }
  if (filters?.status) { conditions.push("status = ?"); values.push(filters.status); }
  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY created_at DESC";
  if (filters?.limit) sql += ` LIMIT ${filters.limit}`;
  return await runAll(sql, values);
}

export { getClient as default };
