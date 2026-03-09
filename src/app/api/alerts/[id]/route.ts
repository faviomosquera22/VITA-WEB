import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { type AlertState, updateAlert } from "@/lib/clinical-store";

interface UpdateAlertPayload {
  state: AlertState;
  comment?: string;
}

function isValidAlertState(value: string): value is AlertState {
  return ["Activa", "En seguimiento", "Resuelta"].includes(value);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const { id } = await context.params;

  let body: UpdateAlertPayload;
  try {
    body = (await request.json()) as UpdateAlertPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  if (!body?.state || !isValidAlertState(body.state)) {
    return NextResponse.json({ error: "Estado de alerta invalido" }, { status: 400 });
  }

  const updated = updateAlert(id, { state: body.state, comment: body.comment }, session);

  if (!updated) {
    return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
