import type { Metadata } from "next";
import { Ticket, ToggleRight, TicketCheck, PiggyBank } from "lucide-react";
import { listCoupons, type CouponFilter } from "@/lib/queries/coupons";
import { money, number as fmtNumber } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CouponsTable } from "@/components/coupons/coupons-table";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

const FILTERS: CouponFilter[] = ["all", "active", "inactive"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const filterParam = one(sp.filter);
  const filter: CouponFilter = FILTERS.includes(filterParam as CouponFilter) ? (filterParam as CouponFilter) : "all";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listCoupons({ q, filter, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Create and track discount codes." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total coupons" value={fmtNumber(result.summary.total)} icon={Ticket} />
        <StatCard label="Enabled" value={fmtNumber(result.summary.active)} icon={ToggleRight} />
        <StatCard label="Redemptions" value={fmtNumber(result.summary.redemptions)} icon={TicketCheck} />
        <StatCard label="Discount given" value={money(result.summary.discountTotalCents)} icon={PiggyBank} />
      </div>

      <CouponsTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        filter={filter}
      />
    </div>
  );
}
