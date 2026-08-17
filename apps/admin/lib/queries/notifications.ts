import "server-only";
import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type NotificationType = "review" | "stock" | "order" | "refund";
export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  description: string;
  href: string;
  at: string | null;
};

const LOW_STOCK_THRESHOLD = 5;

/** Lightweight count for the topbar badge. */
export async function getNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const weekAgo = subDays(new Date(), 7).toISOString();

  const [reviews, stock, orders, refunds] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .lte("inventory_quantity", LOW_STOCK_THRESHOLD)
      .eq("active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "refunded").gte("created_at", weekAgo),
  ]);

  return (reviews.count ?? 0) + (stock.count ?? 0) + (orders.count ?? 0) + (refunds.count ?? 0);
}

/** Full derived feed for the Notifications page. */
export async function getNotifications(): Promise<{ items: NotificationItem[]; count: number }> {
  const supabase = await createClient();
  const weekAgo = subDays(new Date(), 7).toISOString();

  const [reviewsRes, stockRes, ordersRes, refundsRes, countTotal] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, rating, title, created_at, products(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("product_variants")
      .select("id, name, inventory_quantity, products(name)")
      .lte("inventory_quantity", LOW_STOCK_THRESHOLD)
      .eq("active", true)
      .order("inventory_quantity", { ascending: true })
      .limit(8),
    supabase
      .from("orders")
      .select("id, email, total_cents, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select("id, email, total_cents, created_at, status")
      .eq("status", "refunded")
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false })
      .limit(8),
    getNotificationCount(),
  ]);

  const productName = (p: unknown): string => {
    if (Array.isArray(p)) return (p[0] as { name?: string })?.name ?? "";
    return (p as { name?: string } | null)?.name ?? "";
  };

  const items: NotificationItem[] = [];

  for (const r of (reviewsRes.data ?? []) as Record<string, unknown>[]) {
    items.push({
      id: `review-${r.id}`,
      type: "review",
      severity: "info",
      title: "Review awaiting approval",
      description: `${r.rating}★ on ${productName(r.products)}${r.title ? ` — “${r.title}”` : ""}`,
      href: "/reviews",
      at: r.created_at as string,
    });
  }

  for (const v of (stockRes.data ?? []) as Record<string, unknown>[]) {
    const qty = v.inventory_quantity as number;
    items.push({
      id: `stock-${v.id}`,
      type: "stock",
      severity: qty === 0 ? "critical" : "warning",
      title: qty === 0 ? "Out of stock" : "Low stock",
      description: `${productName(v.products)} — ${v.name} (${qty} left)`,
      href: "/inventory?filter=low",
      at: null,
    });
  }

  for (const o of (ordersRes.data ?? []) as Record<string, unknown>[]) {
    items.push({
      id: `order-${o.id}`,
      type: "order",
      severity: "info",
      title: "Order awaiting payment",
      description: `${o.email} — pending`,
      href: `/orders/${o.id}`,
      at: o.created_at as string,
    });
  }

  for (const o of (refundsRes.data ?? []) as Record<string, unknown>[]) {
    items.push({
      id: `refund-${o.id}`,
      type: "refund",
      severity: "warning",
      title: "Order refunded",
      description: `${o.email}`,
      href: `/orders/${o.id}`,
      at: o.created_at as string,
    });
  }

  // Sort: unknown timestamps (stock) first as standing issues, then newest.
  items.sort((a, b) => {
    if (!a.at && !b.at) return 0;
    if (!a.at) return -1;
    if (!b.at) return 1;
    return b.at.localeCompare(a.at);
  });

  return { items, count: countTotal };
}

// Re-exported for typing convenience elsewhere.
export type { OrderStatus };
