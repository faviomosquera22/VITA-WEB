import { NextResponse } from "next/server";

import {
  checkSupabaseConnection,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { status: "configuration_required", database: "not_configured" },
      { status: 503 }
    );
  }

  try {
    const database = await checkSupabaseConnection();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: database.latencyMs,
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable" },
      { status: 503 }
    );
  }
}
