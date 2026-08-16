import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type LogInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

/**
 * Append to the audit trail. Uses the service-role client so logging never
 * fails on RLS, and is best-effort: a logging error must not break the action
 * that triggered it.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("activity_log").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to write activity log entry", error);
  }
}
