import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";
import { createTriageRecord } from "@/lib/triage-record-store";
import { runTriageEngine } from "@/lib/triage/engine/triageEngine";
import type { TriageFormData } from "@/lib/triage/triageTypes";

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  if (session.role !== "professional") {
    return NextResponse.json({ error: "Solo personal clinico puede registrar triaje." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
  }

  const triageData = body as TriageFormData;
  if (!triageData?.identification || !triageData?.chiefComplaint || !triageData?.vitalSigns) {
    return NextResponse.json({ error: "Datos de triaje incompletos." }, { status: 400 });
  }

  // Verificacion server-side del resultado sugerido.
  const verifiedResult = runTriageEngine(triageData);

  const record = createTriageRecord(
    {
      ...triageData,
      suggestedResult: verifiedResult,
    },
    session,
    verifiedResult
  );

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "CASE_CREATED",
    targetType: "case",
    targetId: record.id,
    detail: `Triaje registrado para paciente ${record.patientId}. Nivel ${verifiedResult.suggestedColor}.`,
  });

  if (verifiedResult.codePurple) {
    appendAuditEvent({
      actorName: session.name,
      actorRole: session.role,
      action: "ALERT_UPDATED",
      targetType: "case",
      targetId: record.id,
      detail: "Codigo Purpura activado en triaje.",
    });
  }

  if (verifiedResult.mandatoryNotification) {
    appendAuditEvent({
      actorName: session.name,
      actorRole: session.role,
      action: "ALERT_UPDATED",
      targetType: "case",
      targetId: record.id,
      detail: "Crear tarea obligatoria para trabajo social y notificacion legal.",
    });
  }

  if (verifiedResult.suggestedPriority <= 2) {
    appendAuditEvent({
      actorName: session.name,
      actorRole: session.role,
      action: "ALERT_UPDATED",
      targetType: "case",
      targetId: record.id,
      detail: `Alerta activa para dashboard: prioridad ${verifiedResult.suggestedPriority}.`,
    });
  }

  return NextResponse.json(
    {
      success: true,
      triageId: record.id,
      result: verifiedResult,
    },
    { status: 201 }
  );
}
