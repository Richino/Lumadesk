"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import type { CouponRow, CouponFilter } from "@/lib/queries/coupons";
import type { Coupon } from "@/lib/types";
import { money, dateShort, number as fmtNumber } from "@/lib/format";
import { couponStatus, type CouponComputedStatus } from "@/lib/validation/coupons";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCoupon, updateCoupon, setCouponActive, deleteCoupon } from "@/app/(dashboard)/coupons/actions";

const FILTERS: { value: CouponFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Enabled" },
  { value: "inactive", label: "Disabled" },
];

const STATUS_BADGE: Record<CouponComputedStatus, { label: string; variant: "success" | "default" | "muted" | "warning" }> = {
  active: { label: "Active", variant: "success" },
  scheduled: { label: "Scheduled", variant: "default" },
  expired: { label: "Expired", variant: "muted" },
  "used-up": { label: "Used up", variant: "warning" },
  disabled: { label: "Disabled", variant: "muted" },
};

type Props = {
  rows: CouponRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  filter: CouponFilter;
};

export function CouponsTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(props.q);
  const [editing, setEditing] = useState<Coupon | null | "new">(null);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);

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

  function toggleActive(coupon: CouponRow) {
    startTransition(async () => {
      const result = await setCouponActive(coupon.id, !coupon.active);
      if (result.ok) {
        toast.success(coupon.active ? "Coupon disabled." : "Coupon enabled.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.ok) {
        toast.success("Coupon deleted.");
        setDeleting(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  const rangeStart = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const rangeEnd = Math.min(props.page * props.pageSize, props.total);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search codes…" className="pl-9" />
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
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        {props.rows.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No coupons yet"
            description={props.q ? "Try a different search." : "Create a discount code to run a promotion."}
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-4 w-4" /> New coupon
              </Button>
            }
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Discount total</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((coupon) => {
                const badge = STATUS_BADGE[coupon.status];
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">{coupon.code}</p>
                      {coupon.description && <p className="text-xs text-muted-foreground">{coupon.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {coupon.type === "percent" ? `${coupon.value}% off` : `${money(coupon.value)} off`}
                      {coupon.min_purchase_cents > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          min {money(coupon.min_purchase_cents)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(coupon.used_count)}
                      {coupon.usage_limit !== null && (
                        <span className="text-muted-foreground"> / {coupon.usage_limit}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(coupon.total_discount_cents)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {coupon.expires_at ? dateShort(coupon.expires_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" aria-label="Toggle" onClick={() => toggleActive(coupon)}>
                          <Power className={cn("h-3.5 w-3.5", coupon.active ? "text-emerald-400" : "text-muted-foreground")} />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(coupon)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          aria-label="Delete"
                          onClick={() => setDeleting(coupon)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

      {editing !== null && (
        <CouponDialog coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete coupon?"
        description={`This permanently removes “${deleting?.code}”. Redemption history is kept for analytics.`}
        confirmLabel="Delete coupon"
        destructive
        loading={isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CouponDialog({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = coupon !== null;

  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? ("percent" as "percent" | "fixed"),
    value: coupon ? (coupon.type === "fixed" ? (coupon.value / 100).toString() : String(coupon.value)) : "",
    min_purchase: coupon ? (coupon.min_purchase_cents / 100).toString() : "0",
    usage_limit: coupon?.usage_limit != null ? String(coupon.usage_limit) : "",
    starts_at: toLocalInput(coupon?.starts_at ?? null),
    expires_at: toLocalInput(coupon?.expires_at ?? null),
    active: coupon?.active ?? true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description,
      type: form.type,
      value: form.type === "fixed" ? Math.round(Number(form.value) * 100) : Number(form.value),
      min_purchase_cents: Math.round(Number(form.min_purchase || 0) * 100),
      usage_limit: form.usage_limit.trim() ? Number(form.usage_limit) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
    };
    startTransition(async () => {
      const result = isEdit ? await updateCoupon(coupon.id, payload) : await createCoupon(payload);
      if (result.ok) {
        toast.success(isEdit ? "Coupon saved." : "Coupon created.");
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>Discount codes customers can apply at checkout.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-code" className="text-xs">Code</Label>
              <Input
                id="c-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as "percent" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-desc" className="text-xs">Description</Label>
            <Input id="c-desc" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="10% off your first order" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-value" className="text-xs">{form.type === "percent" ? "Percent off" : "Amount off (USD)"}</Label>
              <Input id="c-value" type="number" min={0} step={form.type === "percent" ? "1" : "0.01"} value={form.value} onChange={(e) => set("value", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-min" className="text-xs">Min. purchase (USD)</Label>
              <Input id="c-min" type="number" min={0} step="0.01" value={form.min_purchase} onChange={(e) => set("min_purchase", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-limit" className="text-xs">Usage limit</Label>
              <Input id="c-limit" type="number" min={1} value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} placeholder="∞" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-start" className="text-xs">Starts</Label>
              <Input id="c-start" type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-end" className="text-xs">Expires</Label>
              <Input id="c-end" type="datetime-local" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{form.active ? "Enabled" : "Disabled"}</p>
              <p className="text-xs text-muted-foreground">Disabled codes are rejected at checkout.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(checked) => set("active", checked)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save coupon" : "Create coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
