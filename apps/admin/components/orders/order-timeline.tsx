import { CircleDot, RefreshCw, Truck, RotateCcw, Ban, ShoppingBag } from "lucide-react";
import type { OrderEvent } from "@/lib/types";
import { dateTime } from "@/lib/format";

const ICONS: Record<string, typeof CircleDot> = {
  status_change: RefreshCw,
  tracking: Truck,
  refund: RotateCcw,
  cancel: Ban,
  created: ShoppingBag,
};

export function OrderTimeline({ events, createdAt }: { events: OrderEvent[]; createdAt: string }) {
  if (events.length === 0) {
    return (
      <div className="relative pl-6">
        <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        <p className="text-sm font-medium">Order placed</p>
        <p className="text-xs text-muted-foreground">{dateTime(createdAt)}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.map((event) => {
        const Icon = ICONS[event.type] ?? CircleDot;
        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
              <Icon className="h-3 w-3 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium leading-tight">{event.message}</p>
            <p className="text-xs text-muted-foreground">{dateTime(event.created_at)}</p>
          </li>
        );
      })}
      <li className="relative">
        <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
          <ShoppingBag className="h-3 w-3 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium leading-tight">Order placed</p>
        <p className="text-xs text-muted-foreground">{dateTime(createdAt)}</p>
      </li>
    </ol>
  );
}
