import Link from "next/link";
import type { Metadata } from "next";
import { Star, Boxes, ShoppingCart, RotateCcw, BellOff, type LucideIcon } from "lucide-react";
import { getNotifications, type NotificationType, type NotificationSeverity } from "@/lib/queries/notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const ICONS: Record<NotificationType, LucideIcon> = {
  review: Star,
  stock: Boxes,
  order: ShoppingCart,
  refund: RotateCcw,
};

const SEVERITY_RING: Record<NotificationSeverity, string> = {
  info: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  critical: "border-rose-500/25 bg-rose-500/10 text-rose-300",
};

export default async function NotificationsPage() {
  const { items, count } = await getNotifications();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="New orders, low stock, refunds, and reviews awaiting approval."
        actions={count > 0 ? <Badge variant="default">{count} open</Badge> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You're all caught up"
          description="New orders, low-stock alerts, refunds, and pending reviews will show up here."
          className="py-20"
        />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/30"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", SEVERITY_RING[item.severity])}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                </div>
                {item.at && (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(item.at)}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
