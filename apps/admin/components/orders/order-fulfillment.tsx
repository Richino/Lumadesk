"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setTracking, saveInternalNotes } from "@/app/(dashboard)/orders/actions";

export function OrderTrackingCard({
  orderId,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [carrierValue, setCarrierValue] = useState(carrier ?? "");
  const [tracking, setTrackingValue] = useState(trackingNumber ?? "");

  const dirty = carrierValue !== (carrier ?? "") || tracking !== (trackingNumber ?? "");

  function save() {
    startTransition(async () => {
      const result = await setTracking(orderId, carrierValue, tracking);
      if (result.ok) {
        toast.success("Tracking saved.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" /> Shipping & tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="carrier" className="text-xs">Carrier</Label>
            <Input id="carrier" value={carrierValue} onChange={(e) => setCarrierValue(e.target.value)} placeholder="UPS, FedEx…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tracking" className="text-xs">Tracking number</Label>
            <Input id="tracking" value={tracking} onChange={(e) => setTrackingValue(e.target.value)} placeholder="1Z…" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={!dirty || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save tracking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderNotesCard({ orderId, notes }: { orderId: string; notes: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(notes ?? "");
  const dirty = value !== (notes ?? "");

  function save() {
    startTransition(async () => {
      const result = await saveInternalNotes(orderId, value);
      if (result.ok) {
        toast.success("Notes saved.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <StickyNote className="h-4 w-4 text-muted-foreground" /> Internal notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Staff-only notes about this order…"
          rows={4}
        />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={save} disabled={!dirty || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
