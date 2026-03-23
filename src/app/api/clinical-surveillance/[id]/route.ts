import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { updateClinicalSurveillanceObservation } from "@/lib/clinical-surveillance/store";
import type { ObservationReviewInput } from "@/lib/clinical-surveillance/types";

function isValidObservationStatus(
  value: string
): value is ObservationReviewInput["status"] {
  return ["acknowledged", "dismissed", "resolved"].includes(value);
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

  let body: ObservationReviewInput;
  try {
    body = (await request.json()) as ObservationReviewInput;
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  if (!body?.status || !isValidObservationStatus(body.status)) {
    return NextResponse.json({ error: "Estado de observacion invalido" }, { status: 400 });
  }

  const updatedObservation = updateClinicalSurveillanceObservation(id, body, session);

  if (!updatedObservation) {
    return NextResponse.json({ error: "Observacion no encontrada" }, { status: 404 });
  }

  return NextResponse.json(updatedObservation);
}
