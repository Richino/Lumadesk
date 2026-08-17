"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import type { UserRole } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "customer"]),
});

async function countAdmins(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

export async function setUserRole(userId: string, role: UserRole): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (userId === admin.id) return { ok: false, error: "You can't change your own role." };
  if (role !== "admin" && role !== "customer") return { ok: false, error: "Invalid role." };

  // Don't allow removing the last remaining admin.
  if (role === "customer") {
    const supabase = await createClient();
    const { data: target } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
    if (target?.role === "admin" && (await countAdmins()) <= 1) {
      return { ok: false, error: "You can't demote the last admin." };
    }
  }

  // Role changes bypass RLS via service-role (authenticated can't update users.role).
  const service = createServiceRoleClient();
  const { error } = await service.from("users").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "user.role_change",
    entityType: "user",
    entityId: userId,
    summary: `Set user ${userId.slice(0, 8)} role to ${role}`,
    metadata: { role },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function inviteUser(input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const service = createServiceRoleClient();
  const { data, error } = await service.auth.admin.inviteUserByEmail(parsed.data.email);
  if (error) return { ok: false, error: error.message };

  // handle_new_user() has already created the public.users row; set the role.
  if (parsed.data.role === "admin" && data.user) {
    await service.from("users").update({ role: "admin" }).eq("id", data.user.id);
  }

  await logActivity({
    actorId: admin.id,
    action: "user.invite",
    entityType: "user",
    entityId: data.user?.id ?? null,
    summary: `Invited ${parsed.data.email} as ${parsed.data.role}`,
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function removeUser(userId: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (userId === admin.id) return { ok: false, error: "You can't remove your own account." };

  // Deleting the auth user cascades to public.users and their data.
  const service = createServiceRoleClient();
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "user.remove",
    entityType: "user",
    entityId: userId,
    summary: `Removed user ${userId.slice(0, 8)}`,
  });

  revalidatePath("/users");
  return { ok: true };
}
