import type { Metadata } from "next";
import { listOrders, type OrderSort } from "@/lib/queries/orders";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/orders";
import { PageHeader } from "@/components/shared/page-header";
import { OrdersTable } from "@/components/orders/orders-table";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const SORTS: OrderSort[] = ["created_at", "total_cents", "status"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const q = one(sp.q) ?? "";
  const statusParam = one(sp.status);
  const status: OrderStatus | "all" =
    statusParam && (ORDER_STATUSES as string[]).includes(statusParam) ? (statusParam as OrderStatus) : "all";
  const sortParam = one(sp.sort);
  const sort: OrderSort = sortParam && SORTS.includes(sortParam as OrderSort) ? (sortParam as OrderSort) : "created_at";
  const dir = one(sp.dir) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listOrders({ q, status, sort, dir, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Search, filter, and fulfill customer orders." />
      <OrdersTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        status={status}
        sort={sort}
        dir={dir}
      />
    </div>
  );
}
