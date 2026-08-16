import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics"
      description="Deeper revenue, sales, and customer analytics with sales-by-day/month breakdowns, top products, refund rate, and CSV exports. Builds on the dashboard in a later phase."
    />
  );
}
