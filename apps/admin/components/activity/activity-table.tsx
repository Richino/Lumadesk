"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, Loader2, ScrollText } from "lucide-react";
import type { ActivityRow } from "@/lib/queries/activity";
import { dateTime, relativeTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  rows: ActivityRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  entityType: string;
  entityTypes: string[];
};

function labelize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ActivityTable(props: Props) {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the audit trail…" className="pl-9" />
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
          value={props.entityType}
          onValueChange={(value) => updateParams({ entity: value === "all" ? null : value, page: null })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {props.entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {labelize(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      {props.rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing logged yet"
          description="Admin actions across orders, products, inventory, reviews, and coupons will appear here."
        />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {props.rows.map((row) => (
            <li key={row.id} className="relative">
              <span className="absolute -left-[27px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">{row.summary}</p>
                <span className="whitespace-nowrap text-xs text-muted-foreground" title={dateTime(row.created_at)}>
                  {relativeTime(row.created_at)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="muted">{labelize(row.entity_type)}</Badge>
                <span className="font-mono">{row.action}</span>
                <span>·</span>
                <span>{row.actor_name ?? "System"}</span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{props.total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${props.total}`}</p>
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
