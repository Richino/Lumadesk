import "server-only";
import { createClient } from "@/lib/supabase/server";
import { REVENUE_STATUSES } from "@/lib/orders";
import type { Customer, Order } from "@/lib/types";

export type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  order_count: number;
  lifetime_spend: number;
  last_order_at: string | null;
};

export type ListCustomersParams = {
  q?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ListCustomersResult = {
  rows: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function aggregate(orders: { user_id: string | null; total_cents: number; status: string; created_at: string }[]) {
  const byUser = new Map<string, { count: number; spend: number; last: string | null }>();
  for (const order of orders) {
    if (!order.user_id) continue;
    const entry = byUser.get(order.user_id) ?? { count: 0, spend: 0, last: null };
    entry.count += 1;
    if ((REVENUE_STATUSES as string[]).includes(order.status)) entry.spend += order.total_cents;
    if (!entry.last || order.created_at > entry.last) entry.last = order.created_at;
    byUser.set(order.user_id, entry);
  }
  return byUser;
}

export async function listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const ascending = params.dir === "asc";

  let query = supabase
    .from("users")
    .select("id, first_name, last_name, email, avatar_url, created_at", { count: "exact" })
    .eq("role", "customer");

  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load customers: ${error.message}`);

  const users = (data ?? []) as Pick<Customer, "id" | "first_name" | "last_name" | "email" | "avatar_url" | "created_at">[];
  const ids = users.map((u) => u.id);

  let byUser = new Map<string, { count: number; spend: number; last: string | null }>();
  if (ids.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total_cents, status, created_at")
      .in("user_id", ids);
    byUser = aggregate((orders ?? []) as never);
  }

  const rows: CustomerRow[] = users.map((u) => {
    const stats = byUser.get(u.id);
    return {
      ...u,
      order_count: stats?.count ?? 0,
      lifetime_spend: stats?.spend ?? 0,
      last_order_at: stats?.last ?? null,
    };
  });

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export type CustomerDetail = {
  customer: Customer;
  orders: Order[];
  addresses: {
    id: string;
    full_name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    phone: string | null;
    is_default: boolean;
  }[];
  stats: { order_count: number; lifetime_spend: number; avg_order: number; last_order_at: string | null };
};

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const { data: customer } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (!customer) return null;

  const [ordersRes, addressesRes] = await Promise.all([
    supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const revenueOrders = orders.filter((o) => (REVENUE_STATUSES as string[]).includes(o.status));
  const lifetimeSpend = revenueOrders.reduce((sum, o) => sum + o.total_cents, 0);

  return {
    customer: customer as Customer,
    orders,
    addresses: (addressesRes.data ?? []) as CustomerDetail["addresses"],
    stats: {
      order_count: orders.length,
      lifetime_spend: lifetimeSpend,
      avg_order: revenueOrders.length > 0 ? Math.round(lifetimeSpend / revenueOrders.length) : 0,
      last_order_at: orders[0]?.created_at ?? null,
    },
  };
}
