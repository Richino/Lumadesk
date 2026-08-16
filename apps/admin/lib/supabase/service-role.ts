import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client that bypasses RLS. Use ONLY behind the requireAdmin()
 * gate for aggregate dashboard reads and privileged writes (e.g. adjusting
 * another user's order). Never import into client code.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
