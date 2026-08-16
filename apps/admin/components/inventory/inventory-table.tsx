"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, Loader2, Boxes, SlidersHorizontal } from "lucide-react";
import type { InventoryRow, InventoryFilter } from "@/lib/queries/inventory";
import { money, number as fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";

const FILTERS: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

type Props = {
  rows: InventoryRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  filter: InventoryFilter;
};

export function InventoryTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(props.q);
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);

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
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search variants…" className="pl-9" />
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
              onClick={() => updateParams({ filter: f.value === "all" ? null : f.value, page: null })}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                props.filter === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        {props.rows.length === 0 ? (
          <EmptyState icon={Boxes} title="No variants found" description="Try a different search or filter." className="border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((row) => {
                const out = row.on_hand === 0;
                const low = !out && row.on_hand <= 5;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{row.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.finish} · {row.frame} · {money(row.price_cents)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmtNumber(row.on_hand)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtNumber(row.reserved)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNumber(row.available)}</TableCell>
                    <TableCell>
                      {out ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : low ? (
                        <Badge variant="warning">Low</Badge>
                      ) : (
                        <Badge variant="success">In stock</Badge>
                      )}
                      {!row.active && <Badge variant="muted" className="ml-1">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setAdjusting(row)}>
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
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

      {adjusting && (
        <AdjustStockDialog variant={adjusting} open={!!adjusting} onOpenChange={(open) => !open && setAdjusting(null)} />
      )}
    </div>
  );
}
