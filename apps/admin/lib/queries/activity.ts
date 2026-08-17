import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fullName } from "@/lib/format";
import type { ActivityLogEntry } from "@/lib/types";

export type ActivityRow = ActivityLogEntry & { actor_name: string | null };

export type ListActivityParams = {
  q?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
};

export type ListActivityResult = {
  rows: ActivityRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  entityTypes: string[];
};

export async function listActivity(params: ListActivityParams): Promise<ListActivityResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 30));

  let query = supabase.from("activity_log").select("*", { count: "exact" });

  if (params.entityType && params.entityType !== "all") {
    query = query.eq("entity_type", params.entityType);
  }
  if (params.q?.trim()) {
    query = query.ilike("summary", `%${params.q.trim()}%`);
  }

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load activity: ${error.message}`);

  const entries = (data ?? []) as ActivityLogEntry[];

  // Resolve actor display names (activity_log.actor_id → auth.users, so join via public.users separately).
  const actorIds = [...new Set(entries.map((e) => e.actor_id).filter(Boolean))] as string[];
  const nameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", actorIds);
    for (const u of (users ?? []) as { id: string; first_name: string; last_name: string; email: string }[]) {
      nameById.set(u.id, fullName(u.first_name, u.last_name, u.email));
    }
  }

  const rows: ActivityRow[] = entries.map((e) => ({
    ...e,
    actor_name: e.actor_id ? nameById.get(e.actor_id) ?? null : null,
  }));

  // Entity types present, for the filter dropdown.
  const { data: types } = await supabase.from("activity_log").select("entity_type");
  const entityTypes = [...new Set((types ?? []).map((t: { entity_type: string }) => t.entity_type))].sort();

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), entityTypes };
}
