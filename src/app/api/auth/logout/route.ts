import { type NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookie,
  getRequestSession,
  revokeRequestSession,
} from "@/lib/auth";
import { recordAuditEvent } from "@/lib/repositories/audit-repository";

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (session) {
    await recordAuditEvent(session, {
      action: "LOGOUT",
      targetType: "auth",
      targetId: session.id,
      detail: "Cierre de sesion manual.",
    });
    await revokeRequestSession(request);
  }

  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
