"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, History } from "lucide-react";
import { toast } from "sonner";
import type { InventoryRow } from "@/lib/queries/inventory";
import type { InventoryMovement, InventoryReason } from "@/lib/types";
import { dateTime, number as fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustInventory, fetchInventoryHistory } from "@/app/(dashboard)/inventory/actions";

type Mode = "add" | "remove" | "set";

const REASONS: { value: InventoryReason; label: string }[] = [
  { value: "restock", label: "Restock" },
  { value: "adjustment", label: "Adjustment" },
  { value: "correction", label: "Correction" },
  { value: "damage", label: "Damage" },
  { value: "return", label: "Customer return" },
  { value: "initial", label: "Initial count" },
];

export function AdjustStockDialog({
  variant,
  open,
  onOpenChange,
}: {
  variant: InventoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("add");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState<InventoryReason>("restock");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<InventoryMovement[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("add");
    setQty("1");
    setReason("restock");
    setNote("");
    setHistory(null);
    fetchInventoryHistory(variant.id).then(setHistory);
  }, [open, variant.id]);

  const amount = Math.max(0, Math.floor(Number(qty) || 0));
  const delta = mode === "add" ? amount : mode === "remove" ? -amount : amount - variant.on_hand;
  const resulting = variant.on_hand + delta;
  const invalid = amount === 0 && mode !== "set" ? true : resulting < 0 || delta === 0;

  function submit() {
    startTransition(async () => {
      const result = await adjustInventory({ variantId: variant.id, delta, reason, note });
      if (result.ok) {
        toast.success(`Stock updated to ${result.resulting} units.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {variant.product_name} — {variant.variant_name}. On hand: {variant.on_hand}, reserved:{" "}
            {variant.reserved}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
            {(["add", "remove", "set"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium capitalize transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "set" ? "Set to" : m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-xs">
                {mode === "set" ? "New on-hand quantity" : "Quantity"}
              </Label>
              <Input
                id="qty"
                type="number"
                min={0}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as InventoryReason)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs">Note (optional)</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="PO number, supplier, context…" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Resulting on-hand</span>
            <span className={cn("font-semibold tabular-nums", resulting < 0 && "text-rose-400")}>
              {variant.on_hand} → {resulting}
            </span>
          </div>

          {/* History */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Recent movements
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {history === null ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No movements recorded yet.</p>
              ) : (
                history.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="capitalize text-muted-foreground">{m.reason}</span>
                    <span className={cn("tabular-nums font-medium", m.delta > 0 ? "text-emerald-400" : "text-rose-400")}>
                      {m.delta > 0 ? "+" : ""}
                      {fmtNumber(m.delta)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">→ {m.resulting_quantity}</span>
                    <span className="ml-auto text-muted-foreground">{dateTime(m.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={invalid || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
