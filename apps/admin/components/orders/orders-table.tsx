"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderRow, OrderSort } from "@/lib/queries/orders";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/orders";
import { money, dateTime, number as fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingCart } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkUpdateStatus } from "@/app/(dashboard)/orders/actions";

type Props = {
  rows: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: OrderStatus | "all";
  sort: OrderSort;
  dir: "asc" | "desc";
};

export function OrdersTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(props.q);

  // Reset selection whenever the underlying rows change (page/filter change).
  useEffect(() => setSelected(new Set()), [props.rows]);

  // Debounced search → URL.
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

  function toggleSort(column: OrderSort) {
    const nextDir = props.sort === column && props.dir === "desc" ? "asc" : "desc";
    updateParams({ sort: column, dir: nextDir, page: null });
  }

  const allSelected = props.rows.length > 0 && selected.size === props.rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(props.rows.map((r) => r.id)));
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function runBulk(status: OrderStatus) {
    const ids = [...selected];
    startTransition(async () => {
      const result = await bulkUpdateStatus(ids, status);
      if (result.ok) {
        toast.success(`${ids.length} order${ids.length === 1 ? "" : "s"} updated to ${ORDER_STATUS_META[status].label}.`);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const rangeStart = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const rangeEnd = Math.min(props.page * props.pageSize, props.total);

  const sortIcon = useMemo(
    () => (col: OrderSort) => {
      if (props.sort !== col) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
      return props.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
    },
    [props.sort, props.dir]
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or tracking number…"
            className="pl-9"
          />
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
        <Select
          value={props.status}
          onValueChange={(value) => updateParams({ status: value === "all" ? null : value, page: null })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Mark as</span>
          {(["processing", "fulfilled", "cancelled"] as OrderStatus[]).map((s) => (
            <Button key={s} size="sm" variant="outline" disabled={isPending} onClick={() => runBulk(s)}>
              {ORDER_STATUS_META[s].label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border">
        {props.rows.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={props.q || props.status !== "all" ? "Try adjusting your search or filters." : "Orders will appear here as customers check out."}
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                    Status {sortIcon("status")}
                  </button>
                </TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("total_cents")}>
                    Total {sortIcon("total_cents")}
                  </button>
                </TableHead>
                <TableHead>
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("created_at")}>
                    Date {sortIcon("created_at")}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleRow(row.id)}
                      aria-label={`Select order ${row.id.slice(0, 8)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${row.id}`} className="font-mono text-xs font-medium text-foreground hover:text-primary">
                      #{row.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    <Link href={`/orders/${row.id}`} className="hover:text-primary">
                      {row.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmtNumber(row.item_count)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{money(row.total_cents)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{dateTime(row.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {props.total === 0 ? "No results" : `${fmtNumber(rangeStart)}–${fmtNumber(rangeEnd)} of ${fmtNumber(props.total)}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={props.page <= 1 || isPending}
            onClick={() => updateParams({ page: String(props.page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className={cn("tabular-nums", isPending && "opacity-50")}>
            Page {props.page} / {props.pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={props.page >= props.pageCount || isPending}
            onClick={() => updateParams({ page: String(props.page + 1) })}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
