import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";
import { confirmTriageRecord } from "@/lib/triage-record-store";
import type { UnifiedTriageColor } from "@/lib/triage/triageTypes";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
  }

  const payload = body as {
    confirmedLevel?: UnifiedTriageColor;
    reclassificationReason?: string;
  };

  if (!payload.confirmedLevel) {
    return NextResponse.json({ error: "confirmedLevel es obligatorio." }, { status: 400 });
  }

  try {
    const updated = confirmTriageRecord(
      id,
      {
        confirmedLevel: payload.confirmedLevel,
        reclassificationReason: payload.reclassificationReason,
      },
      session
    );

    if (!updated) {
      return NextResponse.json({ error: "Triage no encontrado." }, { status: 404 });
    }

    appendAuditEvent({
      actorName: session.name,
      actorRole: session.role,
      action: "ALERT_UPDATED",
      targetType: "case",
      targetId: updated.id,
      detail: payload.reclassificationReason?.trim()
        ? `Triaje reclasificado a ${payload.confirmedLevel}.`
        : `Triaje confirmado en ${payload.confirmedLevel}.`,
    });

    if (updated.confirmedPriority === 1) {
      appendAuditEvent({
        actorName: session.name,
        actorRole: session.role,
        action: "ALERT_UPDATED",
        targetType: "case",
        targetId: updated.id,
        detail: "Prioridad I confirmada: activar alerta inmediata en dashboard.",
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo confirmar/reclasificar el triaje.",
      },
      { status: 400 }
    );
  }
}
