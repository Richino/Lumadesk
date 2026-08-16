import type { Metadata } from "next";
import { listCustomers } from "@/lib/queries/customers";
import { PageHeader } from "@/components/shared/page-header";
import { CustomersTable } from "@/components/customers/customers-table";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listCustomers({ q, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Everyone who's registered with the store." />
      <CustomersTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
      />
    </div>
  );
}
