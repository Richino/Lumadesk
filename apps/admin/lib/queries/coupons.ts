import "server-only";
import { createClient } from "@/lib/supabase/server";
import { couponStatus, type CouponComputedStatus } from "@/lib/validation/coupons";
import type { Coupon } from "@/lib/types";

export type CouponRow = Coupon & { status: CouponComputedStatus; total_discount_cents: number };

export type CouponFilter = "all" | "active" | "inactive";

export type ListCouponsParams = {
  q?: string;
  filter?: CouponFilter;
  page?: number;
  pageSize?: number;
};

export type CouponSummary = {
  total: number;
  active: number;
  redemptions: number;
  discountTotalCents: number;
};

export type ListCouponsResult = {
  rows: CouponRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: CouponSummary;
};

export async function listCoupons(params: ListCouponsParams): Promise<ListCouponsResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const filter = params.filter ?? "all";

  let query = supabase.from("coupons").select("*", { count: "exact" });

  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(`code.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (filter === "active") query = query.eq("active", true);
  if (filter === "inactive") query = query.eq("active", false);

  const fromIndex = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(fromIndex, fromIndex + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load coupons: ${error.message}`);

  const coupons = (data ?? []) as Coupon[];

  // Discount totals per coupon from the redemption ledger.
  const discountByCoupon = new Map<string, number>();
  const ids = coupons.map((c) => c.id);
  if (ids.length > 0) {
    const { data: redemptions } = await supabase
      .from("coupon_redemptions")
      .select("coupon_id, amount_cents")
      .in("coupon_id", ids);
    for (const r of (redemptions ?? []) as { coupon_id: string; amount_cents: number }[]) {
      discountByCoupon.set(r.coupon_id, (discountByCoupon.get(r.coupon_id) ?? 0) + r.amount_cents);
    }
  }

  const rows: CouponRow[] = coupons.map((c) => ({
    ...c,
    status: couponStatus(c),
    total_discount_cents: discountByCoupon.get(c.id) ?? 0,
  }));

  // Store-wide summary.
  const [{ data: allCoupons }, { data: allRedemptions }] = await Promise.all([
    supabase.from("coupons").select("active"),
    supabase.from("coupon_redemptions").select("amount_cents"),
  ]);
  const summary: CouponSummary = {
    total: (allCoupons ?? []).length,
    active: (allCoupons ?? []).filter((c: { active: boolean }) => c.active).length,
    redemptions: (allRedemptions ?? []).length,
    discountTotalCents: (allRedemptions ?? []).reduce(
      (sum: number, r: { amount_cents: number }) => sum + r.amount_cents,
      0
    ),
  };

  const total = count ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), summary };
}
