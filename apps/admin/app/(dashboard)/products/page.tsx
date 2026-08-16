import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";
import { listProducts, type ProductStatusFilter } from "@/lib/queries/products";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/components/products/products-table";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const STATUSES: ProductStatusFilter[] = ["all", "active", "draft"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const statusParam = one(sp.status);
  const status: ProductStatusFilter = STATUSES.includes(statusParam as ProductStatusFilter)
    ? (statusParam as ProductStatusFilter)
    : "all";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listProducts({ q, status, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog, variants, and pricing."
        actions={
          <Button asChild size="sm">
            <Link href="/products/new">
              <PlusCircle className="h-4 w-4" /> New product
            </Link>
          </Button>
        }
      />
      <ProductsTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        status={status}
      />
    </div>
  );
}
