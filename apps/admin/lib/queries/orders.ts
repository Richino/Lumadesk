import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderEvent, OrderStatus } from "@/lib/types";

export type OrderRow = Pick<
  Order,
  "id" | "email" | "status" | "total_cents" | "created_at" | "tracking_number"
> & { item_count: number };

export type OrderSort = "created_at" | "total_cents" | "status";

export type ListOrdersParams = {
  q?: string;
  status?: OrderStatus | "all";
  sort?: OrderSort;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ListOrdersResult = {
  rows: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const SORTABLE: OrderSort[] = ["created_at", "total_cents", "status"];

export async function listOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const sort: OrderSort = SORTABLE.includes(params.sort as OrderSort) ? (params.sort as OrderSort) : "created_at";
  const ascending = params.dir === "asc";

  let query = supabase
    .from("orders")
    .select("id, email, status, total_cents, created_at, tracking_number, order_items(count)", {
      count: "exact",
    });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`email.ilike.%${q}%,tracking_number.ilike.%${q}%`);
  }

  const fromIndex = (page - 1) * pageSize;
  query = query.order(sort, { ascending }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load orders: ${error.message}`);

  const rows: OrderRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const itemAgg = row.order_items as { count: number }[] | null;
    return {
      id: row.id as string,
      email: row.email as string,
      status: row.status as OrderStatus,
      total_cents: row.total_cents as number,
      created_at: row.created_at as string,
      tracking_number: (row.tracking_number as string | null) ?? null,
      item_count: itemAgg?.[0]?.count ?? 0,
    };
  });

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export type OrderDetail = {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
  customer: { id: string; first_name: string; last_name: string; email: string } | null;
};

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load order: ${error.message}`);
  if (!order) return null;

  const [itemsRes, eventsRes, customerRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    supabase.from("order_events").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    order.user_id
      ? supabase.from("users").select("id, first_name, last_name, email").eq("id", order.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    order: order as Order,
    items: (itemsRes.data ?? []) as OrderItem[],
    events: (eventsRes.data ?? []) as OrderEvent[],
    customer: (customerRes.data as OrderDetail["customer"]) ?? null,
  };
}

/** Distinct status counts for the list filter chips. */
export async function getOrderStatusCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("status");
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { status: string }[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
