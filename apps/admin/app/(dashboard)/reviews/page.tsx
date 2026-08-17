import type { Metadata } from "next";
import { listReviews, type ReviewStatusFilter } from "@/lib/queries/reviews";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewsTable } from "@/components/reviews/reviews-table";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

const STATUSES: ReviewStatusFilter[] = ["pending", "approved", "rejected", "all"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const statusParam = one(sp.status);
  const status: ReviewStatusFilter = STATUSES.includes(statusParam as ReviewStatusFilter)
    ? (statusParam as ReviewStatusFilter)
    : "pending";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listReviews({ q, status, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Moderate customer reviews and feature the best ones." />
      <ReviewsTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        status={status}
        counts={result.counts}
      />
    </div>
  );
}
