import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import { createCase, listCases } from "@/lib/repositories/case-repository";
import { recordAuditEvent } from "@/lib/repositories/audit-repository";

const newCaseSchema = z.object({
  triage: z.enum(["rojo", "naranja", "amarillo", "verde", "azul"]),
  patientName: z.string().trim().min(1).max(150),
  age: z.number().int().min(0).max(130),
  reason: z.string().trim().min(1).max(2000),
  origin: z.enum(["app", "web"]).default("web"),
  idempotencyKey: z.string().trim().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  try {
    const items = await listCases(session);
    await recordAuditEvent(session, {
      action: "CASES_READ",
      targetType: "case",
      targetId: "list",
      detail: `Consulta de listado de casos (${items.length} resultados).`,
    });
    return NextResponse.json(items, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron consultar los casos" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const parsed = newCaseSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Revisa los campos obligatorios y la edad (0–130)." },
      { status: 400 },
    );
  if (!session.institutionId)
    return NextResponse.json(
      { error: "La cuenta no tiene una institución asignada." },
      { status: 403 },
    );
  try {
    const item = await createCase(parsed.data, session);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el caso" },
      { status: 503 },
    );
  }
}
