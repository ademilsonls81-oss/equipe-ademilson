# ==================================================
# SETUP SCRIPT - Equipe Ademilson
# Cria todos os arquivos do projeto de uma vez
# ==================================================

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot

function Write-File($rel, $content) {
    $path = Join-Path $base $rel
    $dir = Split-Path $path -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK: $rel"
}

Write-Host "`n== Criando arquivos do projeto Equipe Ademilson ==`n"

# ---- .env.local ----
Write-File ".env.local" @"
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
NEXT_PUBLIC_WHATSAPP_MESSAGE=Olá! Vi sobre a Equipe Ademilson e quero saber mais sobre como participar dos projetos de gravação de vídeos para IA.
NEXT_PUBLIC_SITE_URL=https://equipadedemilson.com.br
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_META_PIXEL_ID=
ADMIN_PASSWORD=admin123
ADMIN_SECRET_KEY=troque-esta-chave-secreta-aleatoria-longa-2024
DATABASE_PATH=./data/equipe-ademilson.db
"@

# ---- src/lib/db.ts ----
Write-File "src/lib/db.ts" @'
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/equipe-ademilson.db";
const dbPath = path.resolve(process.cwd(), DB_PATH);
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
export default getDb;
'@

# ---- src/lib/utils.ts ----
Write-File "src/lib/utils.ts" @'
export function generateUid(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
}
export function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "ADE";
  return prefix + Math.floor(100 + Math.random() * 900);
}
export function getWhatsAppUrl(phone: string, msg: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
'@

# ---- src/lib/auth.ts ----
Write-File "src/lib/auth.ts" @'
import { NextRequest } from "next/server";

export function checkAdminAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  const [type, credentials] = auth.split(" ");
  if (type !== "Basic") return false;
  const decoded = Buffer.from(credentials || "", "base64").toString("utf-8");
  const [, password] = decoded.split(":");
  return password === process.env.ADMIN_PASSWORD;
}
'@

# ---- API: register ----
Write-File "src/app/api/register/route.ts" @'
import { NextRequest, NextResponse } from "next/server";
import { createRegistration, createReferralCode, getReferralCode } from "@/lib/db";
import { generateUid, generateReferralCode } from "@/lib/utils";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, whatsapp, city, state, age_range, has_smartphone, has_support, how_found, ref } = body;

    if (!name || !whatsapp || !city || !state || !age_range || !has_smartphone || !has_support || !how_found)
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    if (!STATES.includes(state))
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    if (whatsapp.replace(/\D/g,"").length < 10)
      return NextResponse.json({ error: "WhatsApp inválido." }, { status: 400 });

    let referral_code: string | null = null;
    if (ref) {
      const rc = getReferralCode(ref);
      if (rc) referral_code = rc.code;
    }

    const url = new URL(req.url);
    const uid = generateUid();
    const reg = createRegistration({
      uid, name: name.trim(), whatsapp: whatsapp.replace(/\D/g,""),
      city: city.trim(), state, age_range, has_smartphone, has_support, how_found,
      referral_code,
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    });

    const myCode = generateReferralCode(name);
    createReferralCode(uid, myCode);

    return NextResponse.json({ success: true, uid, referral_code: myCode });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
'@

# ---- API: admin ----
Write-File "src/app/api/admin/route.ts" @'
import { NextRequest, NextResponse } from "next/server";
import { getAllRegistrations, getStats } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic realm=\"Admin\"" } });
  }
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;
  const registrations = getAllRegistrations(limit, offset);
  const stats = getStats();
  return NextResponse.json({ registrations, stats, page, limit });
}
'@

# ---- API: export ----
Write-File "src/app/api/export/route.ts" @'
import { NextRequest, NextResponse } from "next/server";
import { exportCsv } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic realm=\"Admin\"" } });
  }
  const csv = exportCsv();
  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cadastros-equipe-ademilson-${date}.csv"`,
    },
  });
}
'@

# ---- next.config.ts ----
Write-File "next.config.ts" @'
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};
export default nextConfig;
'@

Write-Host "`n== Arquivos base criados com sucesso! ==`n"
