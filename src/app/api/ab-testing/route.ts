import { NextRequest, NextResponse } from "next/server";
import { createABTest, getABTests, getABTestResults, assignABVariant, recordABConversion } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const testId = url.searchParams.get("test_id");

  try {
    if (testId) {
      const results = getABTestResults(testId);
      return NextResponse.json(results);
    }
    const tests = getABTests();
    return NextResponse.json(tests);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { test_id, test_name, test_type, variant_a, variant_b, metric } = body;
      if (!test_id || !test_name || !test_type || !variant_a || !variant_b) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      createABTest({ test_id, test_name, test_type, variant_a, variant_b, metric });
      return NextResponse.json({ ok: true });
    }

    if (action === "assign") {
      const { test_id, session_id } = body;
      if (!test_id || !session_id) {
        return NextResponse.json({ error: "test_id and session_id required" }, { status: 400 });
      }
      const variant = assignABVariant(test_id, session_id);
      return NextResponse.json({ variant });
    }

    if (action === "convert") {
      const { test_id, session_id } = body;
      if (!test_id || !session_id) {
        return NextResponse.json({ error: "test_id and session_id required" }, { status: 400 });
      }
      const results = recordABConversion(test_id, session_id);
      return NextResponse.json({ ok: true, results });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
