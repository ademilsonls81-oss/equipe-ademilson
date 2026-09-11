import { NextRequest, NextResponse } from "next/server";
import { createRegistration, createReferralCode, getReferralCode } from "@/lib/db";
import { generateUid, generateReferralCode } from "@/lib/utils";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, whatsapp, city, state, age_range, has_smartphone, has_support, how_found, ref, utm_source, utm_medium, utm_campaign } = body;

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
      utm_source: utm_source || url.searchParams.get("utm_source"),
      utm_medium: utm_medium || url.searchParams.get("utm_medium"),
      utm_campaign: utm_campaign || url.searchParams.get("utm_campaign"),
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