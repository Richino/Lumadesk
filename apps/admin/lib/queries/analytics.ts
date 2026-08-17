import "server-only";
import {
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { REVENUE_STATUSES } from "@/lib/orders";

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number };
export type TopProduct = { name: string; quantity: number; revenue_cents: number };

export type AnalyticsData = {
  rangeDays: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  refundRate: number | null;
  refundedAmount: number;
  daily: SeriesPoint[];
  monthly: SeriesPoint[];
  topProducts: TopProduct[];
};

function isRevenue(status: string): boolean {
  return (REVENUE_STATUSES as string[]).includes(status);
}

export async function getAnalytics(rangeDays = 90): Promise<AnalyticsData> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const dayFrom = startOfDay(subDays(now, rangeDays - 1));
  const monthFrom = startOfMonth(subMonths(now, 11));
  const earliest = monthFrom < dayFrom ? monthFrom : dayFrom;

  const [ordersRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("created_at, status, total_cents").gte("created_at", earliest.toISOString()),
    supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_cents, orders!inner(status, created_at)")
      .gte("orders.created_at", dayFrom.toISOString()),
  ]);

  const orders = (ordersRes.data ?? []) as { created_at: string; status: string; total_cents: number }[];

  // Daily buckets (in-range).
  const days = eachDayOfInterval({ start: dayFrom, end: startOfDay(now) });
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const d of days) dailyMap.set(format(d, "yyyy-MM-dd"), { revenue: 0, orders: 0 });

  // Monthly buckets (last 12 months).
  const months = eachMonthOfInterval({ start: monthFrom, end: startOfMonth(now) });
  const monthlyMap = new Map<string, { revenue: number; orders: number }>();
  for (const m of months) monthlyMap.set(format(m, "yyyy-MM"), { revenue: 0, orders: 0 });

  let revenue = 0;
  let realizedOrders = 0;
  let totalInRange = 0;
  let refundedInRange = 0;
  let refundedAmount = 0;

  for (const order of orders) {
    const created = new Date(order.created_at);
    const rev = isRevenue(order.status);

    const monthKey = format(created, "yyyy-MM");
    const mBucket = monthlyMap.get(monthKey);
    if (mBucket) {
      mBucket.orders += 1;
      if (rev) mBucket.revenue += order.total_cents;
    }

    if (created >= dayFrom) {
      totalInRange += 1;
      if (order.status === "refunded") {
        refundedInRange += 1;
        refundedAmount += order.total_cents;
      }
      const dayKey = format(created, "yyyy-MM-dd");
      const dBucket = dailyMap.get(dayKey);
      if (dBucket) {
        dBucket.orders += 1;
        if (rev) dBucket.revenue += order.total_cents;
      }
      if (rev) {
        revenue += order.total_cents;
        realizedOrders += 1;
      }
    }
  }

  const daily: SeriesPoint[] = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const b = dailyMap.get(key)!;
    return { key, label: format(d, "MMM d"), revenue: b.revenue / 100, orders: b.orders };
  });

  const monthly: SeriesPoint[] = months.map((m) => {
    const key = format(m, "yyyy-MM");
    const b = monthlyMap.get(key)!;
    return { key, label: format(m, "MMM yyyy"), revenue: b.revenue / 100, orders: b.orders };
  });

  // Top products in range.
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
  const topProducts = [...topMap.values()].sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 8);

  return {
    rangeDays,
    revenue,
    orders: totalInRange,
    avgOrderValue: realizedOrders > 0 ? Math.round(revenue / realizedOrders) : 0,
    refundRate: totalInRange > 0 ? (refundedInRange / totalInRange) * 100 : null,
    refundedAmount,
    daily,
    monthly,
    topProducts,
  };
}
