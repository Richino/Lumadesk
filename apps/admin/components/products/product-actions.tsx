"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setProductActive, deleteProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function ProductActions({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const result = await setProductActive(productId, !active);
      if (result.ok) {
        toast.success(active ? "Product archived." : "Product published.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.ok) {
        toast.success("Product deleted.");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(result.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={toggleActive} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {active ? "Archive" : "Publish"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
        onClick={() => setConfirmDelete(true)}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete product?"
        description="This permanently removes the product and its variants. Products with variants referenced by orders can't be deleted — archive instead."
        confirmLabel="Delete product"
        destructive
        loading={isPending}
        onConfirm={remove}
      />
    </>
  );
}
