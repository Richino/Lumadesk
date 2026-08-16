"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import { getInventoryHistory } from "@/lib/queries/inventory";
import type { InventoryMovement, InventoryReason } from "@/lib/types";

type ActionResult = { ok: true; resulting: number } | { ok: false; error: string };

const REASONS: InventoryReason[] = ["restock", "adjustment", "correction", "damage", "return", "initial"];

export async function adjustInventory(input: {
  variantId: string;
  delta: number;
  reason: InventoryReason;
  note?: string;
}): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!Number.isInteger(input.delta) || input.delta === 0) return { ok: false, error: "Enter a non-zero whole number." };
  if (!REASONS.includes(input.reason)) return { ok: false, error: "Invalid reason." };

  const supabase = await createClient();
  const { data: variant, error: readError } = await supabase
    .from("product_variants")
    .select("inventory_quantity, name")
    .eq("id", input.variantId)
    .maybeSingle();
  if (readError || !variant) return { ok: false, error: readError?.message ?? "Variant not found." };

  const resulting = variant.inventory_quantity + input.delta;
  if (resulting < 0) return { ok: false, error: "Adjustment would drop stock below zero." };

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ inventory_quantity: resulting })
    .eq("id", input.variantId);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    variant_id: input.variantId,
    actor_id: admin.id,
    delta: input.delta,
    reason: input.reason,
    note: input.note?.trim() || null,
    resulting_quantity: resulting,
  });
  if (movementError) {
    // Stock already moved; log the discrepancy but don't hard-fail the UI.
    console.error("Inventory movement insert failed", movementError);
  }

  await logActivity({
    actorId: admin.id,
    action: "inventory.adjust",
    entityType: "product_variant",
    entityId: input.variantId,
    summary: `${input.delta > 0 ? "+" : ""}${input.delta} to ${variant.name} (${input.reason}) → ${resulting}`,
    metadata: { delta: input.delta, reason: input.reason, resulting },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true, resulting };
}

/** Read the movement ledger for one variant (used by the adjust dialog). */
export async function fetchInventoryHistory(variantId: string): Promise<InventoryMovement[]> {
  const admin = await getAdmin();
  if (!admin) return [];
  return getInventoryHistory(variantId);
}
