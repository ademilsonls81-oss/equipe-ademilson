"use client";
import { useEffect } from "react";

function generateSessionId(): string {
  return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("ea_session");
  if (!sid) {
    sid = generateSessionId();
    sessionStorage.setItem("ea_session", sid);
  }
  return sid;
}

export function trackPageview() {
  if (typeof window === "undefined") return;
  const sid = getSessionId();
  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };

  fetch("/api/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sid,
      landing_page: window.location.pathname,
      ...utm,
    }),
  }).catch(() => {});
}

export function trackWhatsAppClick() {
  if (typeof window === "undefined") return;
  const sid = sessionStorage.getItem("ea_session");
  if (!sid) return;

  fetch("/api/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sid, event: "whatsapp_click" }),
  }).catch(() => {});
}

export default function SessionTracker() {
  useEffect(() => {
    trackPageview();
  }, []);

  return null;
}
