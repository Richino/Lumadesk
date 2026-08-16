"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import type { ProductRow, ProductStatusFilter } from "@/lib/queries/products";
import { money, dateShort, number as fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

const FILTERS: { value: ProductStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Published" },
  { value: "draft", label: "Drafts" },
];

type Props = {
  rows: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: ProductStatusFilter;
};

function priceRange(row: ProductRow): string {
  if (row.min_price_cents === null) return "—";
  if (row.min_price_cents === row.max_price_cents) return money(row.min_price_cents);
  return `${money(row.min_price_cents)} – ${money(row.max_price_cents)}`;
}

export function ProductsTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(props.q);

  useEffect(() => {
    if (search === props.q) return;
    const timer = setTimeout(() => updateParams({ q: search || null, page: null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) sp.delete(key);
      else sp.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  const rangeStart = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const rangeEnd = Math.min(props.page * props.pageSize, props.total);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ status: f.value === "all" ? null : f.value, page: null })}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                props.status === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      <div className="rounded-xl border border-border">
        {props.rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={props.q ? "Try a different search." : "Create your first product to get started."}
            action={
              <Button asChild size="sm">
                <Link href="/products/new">New product</Link>
              </Button>
            }
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Variants</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/products/${row.id}`} className="hover:text-primary">
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{row.slug}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.active ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(row.variant_count)}</TableCell>
                  <TableCell className="text-right tabular-nums">{priceRange(row)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(row.total_stock)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{dateShort(row.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{props.total === 0 ? "No results" : `${fmtNumber(rangeStart)}–${fmtNumber(rangeEnd)} of ${fmtNumber(props.total)}`}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={props.page <= 1 || isPending} onClick={() => updateParams({ page: String(props.page - 1) })}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="tabular-nums">Page {props.page} / {props.pageCount}</span>
          <Button variant="outline" size="sm" disabled={props.page >= props.pageCount || isPending} onClick={() => updateParams({ page: String(props.page + 1) })}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
