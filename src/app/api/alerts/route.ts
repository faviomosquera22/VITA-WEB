import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent, listAlerts } from "@/lib/clinical-store";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const alerts = listAlerts();

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "ALERTS_READ",
    targetType: "alert",
    targetId: "list",
    detail: `Consulta de central de alertas (${alerts.length} alertas).`,
  });

  return NextResponse.json(alerts);
}
