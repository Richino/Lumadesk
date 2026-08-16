import "server-only";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { REVENUE_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export type DailyPoint = { date: string; label: string; revenue: number; orders: number };

export type LowStockVariant = {
  id: string;
  name: string;
  slug: string;
  image_path: string;
  inventory_quantity: number;
  price_cents: number;
  product_name: string;
};

export type RecentOrder = {
  id: string;
  email: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
};

export type TopProduct = { name: string; quantity: number; revenue_cents: number };

export type DashboardData = {
  revenue30: number;
  revenueDelta: number | null;
  todayRevenue: number;
  ordersToday: number;
  ordersTodayDelta: number | null;
  customerCount: number;
  avgOrderValue: number;
  refundRate: number | null;
  lowStockCount: number;
  series: DailyPoint[];
  lowStock: LowStockVariant[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
};

const LOW_STOCK_THRESHOLD = 5;

function isRevenue(status: string): boolean {
  return (REVENUE_STATUSES as string[]).includes(status);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const from30 = startOfDay(subDays(now, 29));
  const from60 = startOfDay(subDays(now, 59));

  const [ordersRes, lowStockRes, recentRes, itemsRes, customerRes] = await Promise.all([
    // 60 days of orders powers the 30d totals + prior-period deltas.
    supabase
      .from("orders")
      .select("created_at, status, total_cents")
      .gte("created_at", from60.toISOString()),
    supabase
      .from("product_variants")
      .select("id, name, slug, image_path, inventory_quantity, price_cents, products(name)")
      .lte("inventory_quantity", LOW_STOCK_THRESHOLD)
      .eq("active", true)
      .order("inventory_quantity", { ascending: true })
      .limit(8),
    supabase
      .from("orders")
      .select("id, email, status, total_cents, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_cents, orders!inner(status, created_at)")
      .gte("orders.created_at", from30.toISOString()),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const orders = (ordersRes.data ?? []) as { created_at: string; status: string; total_cents: number }[];

  // --- Daily series (last 30 days, zero-filled) ---
  const days = eachDayOfInterval({ start: from30, end: todayStart });
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (const day of days) buckets.set(format(day, "yyyy-MM-dd"), { revenue: 0, orders: 0 });

  let revenue30 = 0;
  let revenuePrev30 = 0;
  let ordersToday = 0;
  let ordersYesterday = 0;
  let todayRevenue = 0;
  let realizedCount30 = 0;
  let refundedCount = 0;
  let totalCount = 0;

  for (const order of orders) {
    const created = new Date(order.created_at);
    const revenue = isRevenue(order.status);
    const inLast30 = created >= from30;

    if (inLast30) {
      totalCount += 1;
      if (order.status === "refunded") refundedCount += 1;
      const key = format(created, "yyyy-MM-dd");
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.orders += 1;
        if (revenue) bucket.revenue += order.total_cents;
      }
      if (revenue) {
        revenue30 += order.total_cents;
        realizedCount30 += 1;
      }
    } else if (revenue) {
      revenuePrev30 += order.total_cents;
    }

    if (created >= todayStart) {
      ordersToday += 1;
      if (revenue) todayRevenue += order.total_cents;
    } else if (created >= yesterdayStart) {
      ordersYesterday += 1;
    }
  }

  const series: DailyPoint[] = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const bucket = buckets.get(key)!;
    return { date: key, label: format(day, "MMM d"), revenue: bucket.revenue / 100, orders: bucket.orders };
  });

  // --- Low stock ---
  const lowStock: LowStockVariant[] = (lowStockRes.data ?? []).map((v: Record<string, unknown>) => ({
    id: v.id as string,
    name: v.name as string,
    slug: v.slug as string,
    image_path: v.image_path as string,
    inventory_quantity: v.inventory_quantity as number,
    price_cents: v.price_cents as number,
    product_name:
      (v.products as { name?: string } | { name?: string }[] | null)
        ? Array.isArray(v.products)
          ? (v.products[0]?.name ?? "")
          : ((v.products as { name?: string }).name ?? "")
        : "",
  }));

  // --- Top products ---
  const topMap = new Map<string, TopProduct>();
  for (const row of (itemsRes.data ?? []) as {
    product_name: string;
    quantity: number;
    unit_price_cents: number;
    orders: { status: string } | { status: string }[];
  }[]) {
    const status = Array.isArray(row.orders) ? row.orders[0]?.status : row.orders?.status;
    if (!status || !isRevenue(status)) continue;
    const existing = topMap.get(row.product_name) ?? { name: row.product_name, quantity: 0, revenue_cents: 0 };
    existing.quantity += row.quantity;
    existing.revenue_cents += row.quantity * row.unit_price_cents;
    topMap.set(row.product_name, existing);
  }
  const topProducts = [...topMap.values()].sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 5);

  return {
    revenue30,
    revenueDelta: pctChange(revenue30, revenuePrev30),
    todayRevenue,
    ordersToday,
    ordersTodayDelta: pctChange(ordersToday, ordersYesterday),
    customerCount: customerRes.count ?? 0,
    avgOrderValue: realizedCount30 > 0 ? Math.round(revenue30 / realizedCount30) : 0,
    refundRate: totalCount > 0 ? (refundedCount / totalCount) * 100 : null,
    lowStockCount: lowStock.length,
    series,
    lowStock,
    recentOrders: (recentRes.data ?? []) as RecentOrder[],
    topProducts,
  };
}
