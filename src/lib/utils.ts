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