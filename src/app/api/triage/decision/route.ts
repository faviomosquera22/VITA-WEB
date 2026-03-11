import { type NextRequest, NextResponse } from "next/server";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth";
import {
  listTriageDecisionHistory,
  registerTriageDecision,
} from "@/lib/triage-history-store";
import { runTriageEngine } from "@/lib/triage/triageEngine";
import type {
  TriageColor,
  TriageInput,
  TriageManualOverride,
  TriagePriority,
} from "@/lib/triage/triageTypes";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const data = listTriageDecisionHistory(Number.isFinite(limit) ? limit : 20);

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return unauthorizedResponse("Debe iniciar sesion");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
  }

  const root = asObject(body);
  const triageInput = root.triageInput as TriageInput | undefined;

  if (!triageInput) {
    return NextResponse.json(
      { error: "triageInput es obligatorio." },
      { status: 400 }
    );
  }

  const manualOverride = normalizeManualOverride(root.manualOverride);
  const engineResult = runTriageEngine(triageInput);

  const entry = registerTriageDecision(
    {
      triageInput,
      engineResult,
      manualOverride,
    },
    session
  );

  return NextResponse.json({ data: entry }, { status: 201 });
}

function normalizeManualOverride(raw: unknown): TriageManualOverride | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const color = asColor(value.color);
  const priority = asPriority(value.priority);
  const maxWaitMinutes = asNullableNumber(value.maxWaitMinutes);
  const reason = typeof value.reason === "string" ? value.reason.trim() : "";

  if (!color || !priority || maxWaitMinutes === null || !reason) {
    return null;
  }

  return {
    color,
    priority,
    maxWaitMinutes,
    reason,
  };
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asColor(value: unknown): TriageColor | null {
  if (
    value === "rojo" ||
    value === "naranja" ||
    value === "amarillo" ||
    value === "verde" ||
    value === "azul"
  ) {
    return value;
  }

  return null;
}

function asPriority(value: unknown): TriagePriority | null {
  const parsed = asNullableNumber(value);
  if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5) {
    return parsed;
  }

  return null;
}
