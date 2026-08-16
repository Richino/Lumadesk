import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductVariant } from "@/lib/types";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  variant_count: number;
  min_price_cents: number | null;
  max_price_cents: number | null;
  total_stock: number;
};

export type ProductStatusFilter = "all" | "active" | "draft";

export type ListProductsParams = {
  q?: string;
  status?: ProductStatusFilter;
  page?: number;
  pageSize?: number;
};

export type ListProductsResult = {
  rows: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listProducts(params: ListProductsParams): Promise<ListProductsResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const status = params.status ?? "all";

  let query = supabase
    .from("products")
    .select("id, name, slug, active, created_at, product_variants(price_cents, inventory_quantity)", {
      count: "exact",
    });

  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  if (status === "active") query = query.eq("active", true);
  if (status === "draft") query = query.eq("active", false);

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load products: ${error.message}`);

  const rows: ProductRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const variants = (row.product_variants as { price_cents: number; inventory_quantity: number }[]) ?? [];
    const prices = variants.map((v) => v.price_cents);
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      active: row.active as boolean,
      created_at: row.created_at as string,
      variant_count: variants.length,
      min_price_cents: prices.length ? Math.min(...prices) : null,
      max_price_cents: prices.length ? Math.max(...prices) : null,
      total_stock: variants.reduce((sum, v) => sum + v.inventory_quantity, 0),
    };
  });

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProduct(
  id: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) return null;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: true });

  return { product: product as Product, variants: (variants ?? []) as ProductVariant[] };
}
