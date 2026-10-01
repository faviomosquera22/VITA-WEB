import "server-only";

import {
  buildMonitorSnapshot,
  type CareArea,
  type FlowCase,
} from "@/lib/case-flow";
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
  careArea: CareArea;
  updatedAt: string;
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
  updated_at: string;
  result_payload: Record<string, unknown>;
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
    updatedAt: item.updated_at,
    careArea:
      item.result_payload?.careArea === "hospitalizacion"
        ? "hospitalizacion"
        : "general",
  };
}

function scopedCaseQuery(session: SessionUser) {
  const service = getSupabaseServiceClient();
  const query = service
    .from("triage_cases")
    .select(
      "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room,updated_at,result_payload",
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
  actor: SessionUser,
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
      "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room,updated_at,result_payload",
    )
    .single<StoredCase>();

  if (error || !data) {
    if (error?.code === "23505" && payload.idempotency_key) {
      const { data: existing, error: existingError } = await service
        .from("triage_cases")
        .select(
          "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room,updated_at,result_payload",
        )
        .eq("created_by", actor.id)
        .eq("idempotency_key", payload.idempotency_key)
        .single<StoredCase>();

      if (!existingError && existing) {
        return mapCase(existing);
      }
    }

    throw new Error(
      `No se pudo guardar el caso: ${error?.message ?? "respuesta vacia"}`,
    );
  }

  await recordAuditEvent(actor, {
    action: "CASE_CREATED",
    targetType: "case",
    targetId: data.id,
    detail: `Caso creado para ${data.patient_name} con triaje ${data.triage_color}.`,
  });

  return mapCase(data);
}

// Projection queries deliberately never select patient names, reasons, or room free text.
export async function getInstitutionMonitor(actor: SessionUser) {
  if (!actor.institutionId) throw new Error("Institución no asignada");
  const service = getSupabaseServiceClient();
  const items: FlowCase[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await service
      .from("triage_cases")
      .select(
        "id,triage_color,status,created_at,updated_at,result_payload->careArea",
      )
      .eq("institution_id", actor.institutionId)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw new Error("No se pudo consultar el monitor");
    for (const row of data ?? [])
      items.push({
        id: row.id,
        triage: row.triage_color,
        status: row.status,
        date: row.created_at,
        updatedAt: row.updated_at,
        careArea:
          row.careArea === "hospitalizacion" ? "hospitalizacion" : "general",
      });
    if (!data || data.length < 1000) break;
  }
  return buildMonitorSnapshot(items, actor.centerName);
}

export async function updateCaseFlow(
  id: string,
  input: { status: CaseStatus; careArea: CareArea; updatedAt: string },
  actor: SessionUser,
) {
  if (actor.role !== "professional" || !actor.institutionId) return null;
  const service = getSupabaseServiceClient();
  const { data: before, error: readError } = await service
    .from("triage_cases")
    .select("result_payload")
    .eq("id", id)
    .eq("institution_id", actor.institutionId)
    .eq("updated_at", input.updatedAt)
    .maybeSingle();
  if (readError) throw new Error("No se pudo consultar el caso");
  if (!before) return null;
  const { data, error } = await service
    .from("triage_cases")
    .update({
      status: input.status,
      result_payload: { ...before.result_payload, careArea: input.careArea },
    })
    .eq("id", id)
    .eq("institution_id", actor.institutionId)
    .eq("updated_at", input.updatedAt)
    .select(
      "id,triage_color,patient_name,age_years,reason,created_at,origin,status,room,updated_at,result_payload",
    )
    .maybeSingle<StoredCase>();
  if (error) throw new Error("No se pudo actualizar el caso");
  if (!data) return null;
  await recordAuditEvent(actor, {
    action: "CASE_FLOW_UPDATED",
    targetType: "case",
    targetId: id,
    detail: `Estado: ${input.status}; área: ${input.careArea}.`,
  });
  return mapCase(data);
}
