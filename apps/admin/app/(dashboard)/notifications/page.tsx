import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <ComingSoon
      title="Notifications"
      description="A unified feed for new orders, low inventory, refund requests, reviews awaiting approval, and failed payments. Coming in a later phase."
    />
  );
}
