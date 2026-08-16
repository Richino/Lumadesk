"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import { productSchema, variantSchema, slugify } from "@/lib/validation/products";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function pgError(message: string): string {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "That slug is already in use. Choose a different one.";
  }
  return message;
}

export async function createProduct(input: unknown): Promise<Result<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(parsed.data).select("id").single();
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({
    actorId: admin.id,
    action: "product.create",
    entityType: "product",
    entityId: data.id,
    summary: `Created product “${parsed.data.name}”`,
  });

  revalidatePath("/products");
  return { ok: true, data: { id: data.id } };
}

export async function updateProduct(id: string, input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({
    actorId: admin.id,
    action: "product.update",
    entityType: "product",
    entityId: id,
    summary: `Updated product “${parsed.data.name}”`,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { ok: true };
}

export async function setProductActive(id: string, active: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: active ? "product.publish" : "product.archive",
    entityType: "product",
    entityId: id,
    summary: `${active ? "Published" : "Archived"} product ${id.slice(0, 8)}`,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key")) {
      return { ok: false, error: "This product has orders referencing its variants. Archive it instead of deleting." };
    }
    return { ok: false, error: error.message };
  }

  await logActivity({
    actorId: admin.id,
    action: "product.delete",
    entityType: "product",
    entityId: id,
    summary: `Deleted product ${id.slice(0, 8)}`,
  });

  revalidatePath("/products");
  return { ok: true };
}

export async function createVariant(productId: string, input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.finish)}-${slugify(parsed.data.frame)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("product_variants")
    .insert({ ...parsed.data, product_id: productId, slug, currency: "usd" })
    .select("id")
    .single();
  if (error) return { ok: false, error: pgError(error.message) };

  // Seed the stock ledger so the Inventory history starts from the initial count.
  if (parsed.data.inventory_quantity > 0) {
    await supabase.from("inventory_movements").insert({
      variant_id: data.id,
      actor_id: admin.id,
      delta: parsed.data.inventory_quantity,
      reason: "initial",
      resulting_quantity: parsed.data.inventory_quantity,
    });
  }

  await logActivity({
    actorId: admin.id,
    action: "variant.create",
    entityType: "product_variant",
    entityId: data.id,
    summary: `Added variant “${parsed.data.name}”`,
    metadata: { product_id: productId },
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/inventory");
  return { ok: true };
}

export async function updateVariant(id: string, productId: string, input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  // Inventory changes flow through the Inventory module's ledger, so edits here
  // don't touch inventory_quantity.
  const parsed = variantSchema.omit({ inventory_quantity: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({
    actorId: admin.id,
    action: "variant.update",
    entityType: "product_variant",
    entityId: id,
    summary: `Updated variant “${parsed.data.name}”`,
  });

  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function deleteVariant(id: string, productId: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key")) {
      return { ok: false, error: "This variant is referenced by orders. Deactivate it instead of deleting." };
    }
    return { ok: false, error: error.message };
  }

  await logActivity({
    actorId: admin.id,
    action: "variant.delete",
    entityType: "product_variant",
    entityId: id,
    summary: `Deleted variant ${id.slice(0, 8)}`,
  });

  revalidatePath(`/products/${productId}`);
  return { ok: true };
}
