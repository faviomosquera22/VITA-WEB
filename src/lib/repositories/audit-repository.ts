import "server-only";

import type { SessionUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export interface AuditEventInput {
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
}

export async function recordAuditEvent(
  actor: SessionUser,
  event: AuditEventInput
) {
  const service = getSupabaseServiceClient();
  const { error } = await service.from("audit_events").insert({
    institution_id: actor.institutionId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    action: event.action,
    target_type: event.targetType,
    target_id: event.targetId,
    detail: event.detail,
  });

  if (error) {
    throw new Error(`No se pudo registrar la auditoria: ${error.message}`);
  }
}
