import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { appendAuditEvent, listPatients } from "@/lib/clinical-store";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const patients = listPatients();

  appendAuditEvent({
    actorName: session.name,
    actorRole: session.role,
    action: "PATIENTS_READ",
    targetType: "patient",
    targetId: "list",
    detail: `Consulta de listado de pacientes (${patients.length} resultados).`,
  });

  return NextResponse.json(patients);
}
