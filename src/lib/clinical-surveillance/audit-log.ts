import type { SessionUser } from "@/lib/auth";
import type {
  ClinicalObservation,
  ObservationAuditAction,
  ObservationAuditEntry,
} from "@/lib/clinical-surveillance/types";

function buildAuditId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createObservationAuditEntry(input: {
  observationId: string;
  action: ObservationAuditAction;
  actorName: string;
  actorRole: string;
  detail: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}): ObservationAuditEntry {
  return {
    id: buildAuditId("obs-audit"),
    observationId: input.observationId,
    action: input.action,
    actorName: input.actorName,
    actorRole: input.actorRole,
    createdAt: input.createdAt ?? new Date().toISOString(),
    detail: input.detail,
    metadata: input.metadata ?? {},
  };
}

export function buildGenerationAuditEntry(
  observation: ClinicalObservation,
  action: Extract<ObservationAuditAction, "generated" | "regenerated">
) {
  return createObservationAuditEntry({
    observationId: observation.id,
    action,
    actorName: "Sistema de vigilancia",
    actorRole: "system",
    createdAt: observation.createdAt,
    detail:
      action === "generated"
        ? `Observacion generada por motor de reglas: ${observation.title}.`
        : `Observacion regenerada por persistencia del hallazgo: ${observation.title}.`,
    metadata: {
      dedupeKey: observation.dedupeKey,
      priority: observation.priority,
      triggeredRules: observation.triggeredRules.map((rule) => rule.ruleId),
    },
  });
}

export function buildStatusAuditEntry(
  observation: ClinicalObservation,
  actor: SessionUser,
  detail: string
) {
  const action =
    observation.status === "acknowledged" ||
    observation.status === "dismissed" ||
    observation.status === "resolved"
      ? observation.status
      : "acknowledged";

  return createObservationAuditEntry({
    observationId: observation.id,
    action,
    actorName: actor.name,
    actorRole: actor.role,
    detail,
    metadata: {
      dedupeKey: observation.dedupeKey,
      priority: observation.priority,
    },
  });
}
