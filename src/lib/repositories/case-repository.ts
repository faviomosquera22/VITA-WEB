import "server-only";

import type { SessionUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

import { recordAuditEvent } from "./audit-repository";

export type TriageKey = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type CaseStatus = "pendiente" | "en_atencion" | "finalizado";

export interface CaseItem {
  id: string;
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  date: string;
  origin: "app" | "web";
  status: CaseStatus;
  room?: string;
}

export interface NewCaseInput {
  triage: TriageKey;
  patientName: string;
  age: number;
  reason: string;
  origin: "app" | "web";
  idempotencyKey?: string;
}

interface StoredCase {
  id: string;
  triage_color: TriageKey;
  patient_name: string;
  age_years: number;
  reason: string;
  created_at: string;
  origin: "app" | "web";
  status: CaseStatus;
  room: string | null;
}

function mapCase(item: StoredCase): CaseItem {
  return {
    id: item.id,
    triage: item.triage_color,
    patientName: item.patient_name,
    age: item.age_years,
    reason: item.reason,
    date: item.created_at,
    origin: item.origin,
    status: item.status,
    room: item.room ?? undefined,
  };
}

function scopedCaseQuery(session: SessionUser) {
  const service = getSupabaseServiceClient();
  const query = service
    .from("triage_cases")
    .select(
      "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room"
    );

  if (session.role === "patient") {
    return query.eq("created_by", session.id);
  }

  if (!session.institutionId) {
    throw new Error("La cuenta profesional no tiene una institucion asignada.");
  }

  return query.eq("institution_id", session.institutionId);
}

export async function listCases(session: SessionUser): Promise<CaseItem[]> {
  const { data, error } = await scopedCaseQuery(session)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<StoredCase[]>();

  if (error) {
    throw new Error(`No se pudieron consultar los casos: ${error.message}`);
  }

  return (data ?? []).map(mapCase);
}

export async function createCase(
  input: NewCaseInput,
  actor: SessionUser
): Promise<CaseItem> {
  const service = getSupabaseServiceClient();
  const payload = {
    institution_id: actor.institutionId,
    created_by: actor.id,
    patient_name: input.patientName.trim(),
    age_years: input.age,
    reason: input.reason.trim(),
    origin: input.origin,
    status: "pendiente" as const,
    triage_color: input.triage,
    idempotency_key: input.idempotencyKey?.trim() || null,
  };

  const { data, error } = await service
    .from("triage_cases")
    .insert(payload)
    .select(
      "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room"
    )
    .single<StoredCase>();

  if (error || !data) {
    if (error?.code === "23505" && payload.idempotency_key) {
      const { data: existing, error: existingError } = await service
        .from("triage_cases")
        .select(
          "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room"
        )
        .eq("created_by", actor.id)
        .eq("idempotency_key", payload.idempotency_key)
        .single<StoredCase>();

      if (!existingError && existing) {
        return mapCase(existing);
      }
    }

    throw new Error(`No se pudo guardar el caso: ${error?.message ?? "respuesta vacia"}`);
  }

  await recordAuditEvent(actor, {
    action: "CASE_CREATED",
    targetType: "case",
    targetId: data.id,
    detail: `Caso creado para ${data.patient_name} con triaje ${data.triage_color}.`,
  });

  return mapCase(data);
}
