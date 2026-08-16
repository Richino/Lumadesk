"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, RotateCcw, Ban } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/types";
import { ORDER_TRANSITIONS, ORDER_STATUS_META } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateOrderStatus, refundOrder, cancelOrder } from "@/app/(dashboard)/orders/actions";

export function OrderWorkflow({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<null | "refund" | "cancel">(null);
  const [reason, setReason] = useState("");

  const transitions = ORDER_TRANSITIONS[status].filter((s) => s !== "refunded" && s !== "cancelled");
  const terminal = status === "cancelled" || status === "refunded";

  function changeStatus(next: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.ok) {
        toast.success(`Order marked as ${ORDER_STATUS_META[next].label}.`);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function submitDestructive() {
    const action = dialog === "refund" ? refundOrder : cancelOrder;
    startTransition(async () => {
      const result = await action(orderId, reason.trim());
      if (result.ok) {
        toast.success(dialog === "refund" ? "Order refunded." : "Order cancelled.");
        setDialog(null);
        setReason("");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={isPending || terminal}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update status
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Move order to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {transitions.length === 0 ? (
              <DropdownMenuItem disabled>No forward steps</DropdownMenuItem>
            ) : (
              transitions.map((next) => (
                <DropdownMenuItem key={next} onSelect={() => changeStatus(next)}>
                  <span className={`h-1.5 w-1.5 rounded-full ${ORDER_STATUS_META[next].dot}`} />
                  {ORDER_STATUS_META[next].label}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {(status === "paid" || status === "processing" || status === "fulfilled") && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setDialog("refund")}>
            <RotateCcw className="h-4 w-4" /> Refund
          </Button>
        )}
        {!terminal && status !== "fulfilled" && (
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            disabled={isPending}
            onClick={() => setDialog("cancel")}
          >
            <Ban className="h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "refund" ? "Refund order" : "Cancel order"}</DialogTitle>
            <DialogDescription>
              {dialog === "refund"
                ? "This marks the order as refunded and records the reason on the timeline. Process the actual refund in Stripe separately."
                : "This marks the order as cancelled. This can't be undone from here."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional, shown on the internal timeline)…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={isPending}>
              Keep order
            </Button>
            <Button
              variant={dialog === "refund" ? "default" : "destructive"}
              onClick={submitDestructive}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {dialog === "refund" ? "Confirm refund" : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
