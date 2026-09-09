import { NextRequest } from "next/server";

export function checkAdminAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  const [type, credentials] = auth.split(" ");
  if (type !== "Basic") return false;
  const decoded = Buffer.from(credentials || "", "base64").toString("utf-8");
  const [, password] = decoded.split(":");
  return password === process.env.ADMIN_PASSWORD;
}