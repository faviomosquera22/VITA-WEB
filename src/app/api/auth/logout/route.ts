import { NextResponse } from "next/server";

import { clearSessionCookie, getServerSession } from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";

export async function POST() {
  const session = await getServerSession();

  if (session) {
    appendAuditEvent({
      actorName: session.name,
      actorRole: session.role,
      action: "LOGOUT",
      targetType: "auth",
      targetId: session.id,
      detail: "Cierre de sesion manual.",
    });
  }

  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
