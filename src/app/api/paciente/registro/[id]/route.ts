import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent } from "@/lib/clinical-store";
import { getRegisteredPatientById } from "@/lib/patient-intake-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const { id } = await params;
  const record = getRegisteredPatientById(id);

  if (!record) {
    return NextResponse.json({ error: "Paciente no encontrado." }, { status: 404 });
  }

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "PATIENTS_READ",
    targetType: "patient",
    targetId: id,
    detail: `Consulta de ficha de ingreso clinico para ${record.identification.documentNumber}.`,
  });

  return NextResponse.json({ data: record });
}
