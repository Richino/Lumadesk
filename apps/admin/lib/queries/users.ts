import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type UserRoleFilter = "all" | "admin" | "customer";

export type ListUsersParams = {
  q?: string;
  role?: UserRoleFilter;
  page?: number;
  pageSize?: number;
};

export type ListUsersResult = {
  rows: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  adminCount: number;
};

export async function listUsers(params: ListUsersParams): Promise<ListUsersResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const role = params.role ?? "all";

  let query = supabase
    .from("users")
    .select("id, first_name, last_name, email, avatar_url, role, created_at", { count: "exact" });

  if (role !== "all") query = query.eq("role", role);
  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load users: ${error.message}`);

  const { count: adminCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const total = count ?? 0;
  return {
    rows: (data ?? []) as UserRow[],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    adminCount: adminCount ?? 0,
  };
}
