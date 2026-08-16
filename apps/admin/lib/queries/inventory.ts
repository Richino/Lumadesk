import "server-only";
import { createClient } from "@/lib/supabase/server";
import { RESERVING_STATUSES } from "@/lib/orders";
import type { InventoryMovement } from "@/lib/types";

export const LOW_STOCK_THRESHOLD = 5;

export type InventoryRow = {
  id: string;
  product_name: string;
  variant_name: string;
  finish: string;
  frame: string;
  price_cents: number;
  active: boolean;
  on_hand: number;
  reserved: number;
  available: number;
};

export type InventoryFilter = "all" | "low" | "out";

export type ListInventoryParams = {
  q?: string;
  filter?: InventoryFilter;
  page?: number;
  pageSize?: number;
};

export type ListInventoryResult = {
  rows: InventoryRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: { skus: number; onHand: number; lowCount: number; outCount: number };
};

export async function listInventory(params: ListInventoryParams): Promise<ListInventoryResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const filter = params.filter ?? "all";

  let query = supabase
    .from("product_variants")
    .select("id, name, finish, frame, price_cents, active, inventory_quantity, products(name)", {
      count: "exact",
    });

  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`name.ilike.%${q}%,finish.ilike.%${q}%,frame.ilike.%${q}%`);
  }
  if (filter === "low") query = query.lte("inventory_quantity", LOW_STOCK_THRESHOLD).gt("inventory_quantity", 0);
  if (filter === "out") query = query.eq("inventory_quantity", 0);

  const fromIndex = (page - 1) * pageSize;
  query = query.order("inventory_quantity", { ascending: true }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load inventory: ${error.message}`);

  const variants = (data ?? []) as Record<string, unknown>[];
  const ids = variants.map((v) => v.id as string);

  // Reserved = units on unfulfilled orders (pending/paid/processing).
  const reservedByVariant = new Map<string, number>();
  if (ids.length > 0) {
    const { data: reservedRows } = await supabase
      .from("order_items")
      .select("variant_id, quantity, orders!inner(status)")
      .in("variant_id", ids)
      .in("orders.status", RESERVING_STATUSES as string[]);
    for (const row of (reservedRows ?? []) as { variant_id: string | null; quantity: number }[]) {
      if (!row.variant_id) continue;
      reservedByVariant.set(row.variant_id, (reservedByVariant.get(row.variant_id) ?? 0) + row.quantity);
    }
  }

  const rows: InventoryRow[] = variants.map((v) => {
    const onHand = v.inventory_quantity as number;
    const reserved = reservedByVariant.get(v.id as string) ?? 0;
    const product = v.products as { name?: string } | { name?: string }[] | null;
    const productName = Array.isArray(product) ? product[0]?.name ?? "" : product?.name ?? "";
    return {
      id: v.id as string,
      product_name: productName,
      variant_name: v.name as string,
      finish: v.finish as string,
      frame: v.frame as string,
      price_cents: v.price_cents as number,
      active: v.active as boolean,
      on_hand: onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
    };
  });

  // Store-wide summary (independent of the current page/filter).
  const { data: allVariants } = await supabase.from("product_variants").select("inventory_quantity");
  const summaryRows = (allVariants ?? []) as { inventory_quantity: number }[];
  const summary = {
    skus: summaryRows.length,
    onHand: summaryRows.reduce((sum, r) => sum + r.inventory_quantity, 0),
    lowCount: summaryRows.filter((r) => r.inventory_quantity > 0 && r.inventory_quantity <= LOW_STOCK_THRESHOLD).length,
    outCount: summaryRows.filter((r) => r.inventory_quantity === 0).length,
  };

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), summary };
}

export async function getInventoryHistory(variantId: string): Promise<InventoryMovement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("variant_id", variantId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as InventoryMovement[];
}
