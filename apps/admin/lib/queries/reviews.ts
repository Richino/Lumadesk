import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Review, ReviewStatus } from "@/lib/types";

export type ReviewRow = Review & { product_name: string };

export type ReviewStatusFilter = ReviewStatus | "all";

export type ListReviewsParams = {
  q?: string;
  status?: ReviewStatusFilter;
  page?: number;
  pageSize?: number;
};

export type ListReviewsResult = {
  rows: ReviewRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<ReviewStatus, number>;
};

export async function listReviews(params: ListReviewsParams): Promise<ListReviewsResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const status = params.status ?? "pending";

  let query = supabase
    .from("reviews")
    .select("*, products(name)", { count: "exact" });

  if (status !== "all") query = query.eq("status", status);
  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`author_name.ilike.%${q}%,title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);

  const rows: ReviewRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const product = row.products as { name?: string } | { name?: string }[] | null;
    const productName = Array.isArray(product) ? product[0]?.name ?? "" : product?.name ?? "";
    const { products: _products, ...review } = row;
    return { ...(review as Review), product_name: productName };
  });

  // Status counts for the moderation tabs.
  const { data: allStatuses } = await supabase.from("reviews").select("status");
  const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of (allStatuses ?? []) as { status: ReviewStatus }[]) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), counts };
}
