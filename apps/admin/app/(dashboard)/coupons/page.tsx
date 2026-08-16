import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Coupons" };

export default function CouponsPage() {
  return (
    <ComingSoon
      title="Coupons"
      description="Percentage and fixed-amount discounts with expiration, usage limits, minimum purchase, and redemption analytics. Needs a coupons table — coming in a later phase."
    />
  );
}
