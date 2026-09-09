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