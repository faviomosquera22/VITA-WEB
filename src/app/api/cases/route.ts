import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import {
  createCase,
  listCases,
  type TriageKey,
} from "@/lib/repositories/case-repository";
import { recordAuditEvent } from "@/lib/repositories/audit-repository";

interface NewCasePayload {
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  origin?: "app" | "web";
  idempotencyKey?: string;
}

function isValidTriage(value: string): value is TriageKey {
  return ["rojo", "naranja", "amarillo", "verde", "azul"].includes(value);
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const items = await listCases(session);

  await recordAuditEvent(session, {
    action: "CASES_READ",
    targetType: "case",
    targetId: "list",
    detail: `Consulta de listado de casos (${items.length} resultados).`,
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  let body: NewCasePayload;

  try {
    body = (await request.json()) as NewCasePayload;
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  if (!body?.triage || !isValidTriage(body.triage) || !body.patientName || !body.reason) {
    return NextResponse.json({ error: "Campos obligatorios incompletos" }, { status: 400 });
  }

  const newCase = await createCase(
    {
      triage: body.triage,
      patientName: body.patientName,
      age: Number(body.age) || 0,
      reason: body.reason,
      origin: body.origin ?? "web",
      idempotencyKey: body.idempotencyKey,
    },
    session
  );

  return NextResponse.json(newCase, { status: 201 });
}
