"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import { couponSchema } from "@/lib/validation/coupons";

type Result = { ok: true } | { ok: false; error: string };

type NormalizedCoupon = {
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  min_purchase_cents: number;
  usage_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
};

function normalize(input: unknown): { ok: true; data: NormalizedCoupon } | { ok: false; error: string } {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  return {
    ok: true,
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      type: data.type,
      value: data.value,
      min_purchase_cents: data.min_purchase_cents,
      usage_limit: data.usage_limit,
      starts_at: data.starts_at || null,
      expires_at: data.expires_at || null,
      active: data.active,
    },
  };
}

function pgError(message: string): string {
  if (message.includes("duplicate key") && message.includes("code")) {
    return "That coupon code already exists.";
  }
  return message;
}

export async function createCoupon(input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("coupons").insert(result.data).select("id").single();
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({
    actorId: admin.id,
    action: "coupon.create",
    entityType: "coupon",
    entityId: data.id,
    summary: `Created coupon ${result.data.code}`,
  });

  revalidatePath("/coupons");
  return { ok: true };
}

export async function updateCoupon(id: string, input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update(result.data).eq("id", id);
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({
    actorId: admin.id,
    action: "coupon.update",
    entityType: "coupon",
    entityId: id,
    summary: `Updated coupon ${result.data.code}`,
  });

  revalidatePath("/coupons");
  return { ok: true };
}

export async function setCouponActive(id: string, active: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: active ? "coupon.enable" : "coupon.disable",
    entityType: "coupon",
    entityId: id,
    summary: `${active ? "Enabled" : "Disabled"} coupon ${id.slice(0, 8)}`,
  });

  revalidatePath("/coupons");
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "coupon.delete",
    entityType: "coupon",
    entityId: id,
    summary: `Deleted coupon ${id.slice(0, 8)}`,
  });

  revalidatePath("/coupons");
  return { ok: true };
}
