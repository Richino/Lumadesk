"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import { ORDER_STATUS_META } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function recordEvent(
  orderId: string,
  actorId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  await supabase.from("order_events").insert({
    order_id: orderId,
    actor_id: actorId,
    type,
    message,
    metadata,
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!ORDER_STATUS_META[status]) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();
  const { data: prev } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await recordEvent(
    orderId,
    admin.id,
    "status_change",
    `Status changed from ${prev?.status ?? "?"} to ${status}`,
    { from: prev?.status, to: status }
  );
  await logActivity({
    actorId: admin.id,
    action: "order.status_change",
    entityType: "order",
    entityId: orderId,
    summary: `Order ${orderId.slice(0, 8)} → ${status}`,
    metadata: { from: prev?.status, to: status },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function bulkUpdateStatus(orderIds: string[], status: OrderStatus): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (orderIds.length === 0) return { ok: false, error: "No orders selected." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).in("id", orderIds);
  if (error) return { ok: false, error: error.message };

  await Promise.all(
    orderIds.map((id) =>
      recordEvent(id, admin.id, "status_change", `Bulk status change to ${status}`, { to: status })
    )
  );
  await logActivity({
    actorId: admin.id,
    action: "order.bulk_status_change",
    entityType: "order",
    summary: `${orderIds.length} orders → ${status}`,
    metadata: { count: orderIds.length, to: status },
  });

  revalidatePath("/orders");
  return { ok: true };
}

export async function saveInternalNotes(orderId: string, notes: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ internal_notes: notes.trim() || null })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "order.note",
    entityType: "order",
    entityId: orderId,
    summary: `Updated internal notes on order ${orderId.slice(0, 8)}`,
  });

  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function setTracking(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const cleanCarrier = carrier.trim() || null;
  const cleanTracking = trackingNumber.trim() || null;
  const { error } = await supabase
    .from("orders")
    .update({ carrier: cleanCarrier, tracking_number: cleanTracking })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await recordEvent(orderId, admin.id, "tracking", cleanTracking ? `Tracking added: ${cleanCarrier ?? ""} ${cleanTracking}` : "Tracking cleared", {
    carrier: cleanCarrier,
    tracking_number: cleanTracking,
  });
  await logActivity({
    actorId: admin.id,
    action: "order.tracking",
    entityType: "order",
    entityId: orderId,
    summary: `Set tracking on order ${orderId.slice(0, 8)}`,
  });

  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function refundOrder(orderId: string, reason: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await recordEvent(orderId, admin.id, "refund", `Order refunded${reason ? `: ${reason}` : ""}`, { reason });
  await logActivity({
    actorId: admin.id,
    action: "order.refund",
    entityType: "order",
    entityId: orderId,
    summary: `Refunded order ${orderId.slice(0, 8)}`,
    metadata: { reason },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function cancelOrder(orderId: string, reason: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await recordEvent(orderId, admin.id, "cancel", `Order cancelled${reason ? `: ${reason}` : ""}`, { reason });
  await logActivity({
    actorId: admin.id,
    action: "order.cancel",
    entityType: "order",
    entityId: orderId,
    summary: `Cancelled order ${orderId.slice(0, 8)}`,
    metadata: { reason },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
