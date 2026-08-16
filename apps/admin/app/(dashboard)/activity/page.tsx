import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Activity Log" };

export default function ActivityPage() {
  return (
    <ComingSoon
      title="Activity Log"
      description="A full audit trail of every important action across orders, inventory, products, coupons, users, and settings. The activity_log table is already recording — the browsing UI lands in a later phase."
    />
  );
}
