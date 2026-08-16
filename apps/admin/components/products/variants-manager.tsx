"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import type { ProductVariant } from "@/lib/types";
import { money } from "@/lib/format";
import { createVariant, updateVariant, deleteVariant } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type Editing = { variant: ProductVariant | null } | null;

export function VariantsManager({ productId, variants }: { productId: string; variants: ProductVariant[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ProductVariant | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteVariant(deleting.id, productId);
      if (result.ok) {
        toast.success("Variant deleted.");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">Variants</CardTitle>
          <p className="text-sm text-muted-foreground">Finish and frame combinations, pricing, and status.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ variant: null })}>
          <Plus className="h-4 w-4" /> Add variant
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {variants.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No variants yet"
            description="Add at least one finish/frame combination so this product can be purchased."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{variant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {variant.finish} · {variant.frame}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(variant.price_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums">{variant.inventory_quantity}</TableCell>
                  <TableCell>
                    {variant.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ variant })} aria-label="Edit variant">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => setDeleting(variant)}
                        aria-label="Delete variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {editing && (
        <VariantDialog
          productId={productId}
          variant={editing.variant}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete variant?"
        description={`This permanently removes “${deleting?.name}”. Variants referenced by existing orders can't be deleted — deactivate them instead.`}
        confirmLabel="Delete variant"
        destructive
        loading={isPending}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}

function VariantDialog({
  productId,
  variant,
  onClose,
}: {
  productId: string;
  variant: ProductVariant | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = variant !== null;

  const [form, setForm] = useState({
    name: variant?.name ?? "",
    finish: variant?.finish ?? "",
    frame: variant?.frame ?? "",
    price: variant ? (variant.price_cents / 100).toString() : "",
    image_path: variant?.image_path ?? "/images/lumadesk-product-master.png",
    inventory_quantity: variant ? String(variant.inventory_quantity) : "0",
    active: variant?.active ?? true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const payload = {
      name: form.name,
      finish: form.finish,
      frame: form.frame,
      price_cents: Math.round(Number(form.price) * 100),
      image_path: form.image_path,
      inventory_quantity: Number(form.inventory_quantity),
      active: form.active,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateVariant(variant.id, productId, payload)
        : await createVariant(productId, payload);
      if (result.ok) {
        toast.success(isEdit ? "Variant saved." : "Variant added.");
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
          <DialogTitle>{isEdit ? "Edit variant" : "Add variant"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this variant's details and pricing." : "Create a new finish/frame combination."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-name" className="text-xs">Display name</Label>
            <Input id="v-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Natural white oak / Matte black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-finish" className="text-xs">Finish</Label>
              <Input id="v-finish" value={form.finish} onChange={(e) => set("finish", e.target.value)} placeholder="Natural white oak" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-frame" className="text-xs">Frame</Label>
              <Input id="v-frame" value={form.frame} onChange={(e) => set("frame", e.target.value)} placeholder="Matte black" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-price" className="text-xs">Price (USD)</Label>
              <Input id="v-price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="1895.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-stock" className="text-xs">
                {isEdit ? "Stock (managed in Inventory)" : "Initial stock"}
              </Label>
              <Input
                id="v-stock"
                type="number"
                min={0}
                value={form.inventory_quantity}
                onChange={(e) => set("inventory_quantity", e.target.value)}
                disabled={isEdit}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-image" className="text-xs">Image path</Label>
            <Input id="v-image" value={form.image_path} onChange={(e) => set("image_path", e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{form.active ? "Active" : "Inactive"}</p>
              <p className="text-xs text-muted-foreground">Only active variants are purchasable.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(checked) => set("active", checked)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save variant" : "Add variant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
