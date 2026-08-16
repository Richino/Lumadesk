import type { Metadata } from "next";
import { Boxes, PackageCheck, AlertTriangle, PackageX } from "lucide-react";
import { listInventory, type InventoryFilter } from "@/lib/queries/inventory";
import { number as fmtNumber } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { InventoryTable } from "@/components/inventory/inventory-table";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

const FILTERS: InventoryFilter[] = ["all", "low", "out"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const filterParam = one(sp.filter);
  const filter: InventoryFilter = FILTERS.includes(filterParam as InventoryFilter) ? (filterParam as InventoryFilter) : "all";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listInventory({ q, filter, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Track on-hand, reserved, and available stock across every variant." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active SKUs" value={fmtNumber(result.summary.skus)} icon={Boxes} />
        <StatCard label="Units on hand" value={fmtNumber(result.summary.onHand)} icon={PackageCheck} />
        <StatCard label="Low stock" value={fmtNumber(result.summary.lowCount)} icon={AlertTriangle} hint="≤ 5 units" />
        <StatCard label="Out of stock" value={fmtNumber(result.summary.outCount)} icon={PackageX} />
      </div>

      <InventoryTable
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
