import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage() {
  return (
    <ComingSoon
      title="Reviews"
      description="Approve, reject, and feature customer reviews with a verified-purchase badge and a moderation queue. Needs a reviews table — coming in a later phase."
    />
  );
}
