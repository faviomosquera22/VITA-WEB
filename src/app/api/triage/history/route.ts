import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { listTriageHistoryByPatient } from "@/lib/triage-record-store";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim();

  if (!patientId) {
    return NextResponse.json({ error: "patientId es obligatorio." }, { status: 400 });
  }

  const history = listTriageHistoryByPatient(patientId);
  return NextResponse.json({ data: history });
}
