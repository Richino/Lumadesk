"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Check,
  Ban,
  Trash2,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type { ReviewRow, ReviewStatusFilter } from "@/lib/queries/reviews";
import type { ReviewStatus } from "@/lib/types";
import { dateShort, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StarRating } from "@/components/reviews/star-rating";
import { setReviewStatus, toggleReviewFeatured, deleteReview } from "@/app/(dashboard)/reviews/actions";

const TABS: { value: ReviewStatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

type Props = {
  rows: ReviewRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  status: ReviewStatusFilter;
  counts: Record<ReviewStatus, number>;
};

export function ReviewsTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(props.q);
  const [deleting, setDeleting] = useState<ReviewRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (search === props.q) return;
    const timer = setTimeout(() => updateParams({ q: search || null, page: null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) sp.delete(key);
      else sp.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
      setBusyId(null);
    });
  }

  const rangeStart = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const rangeEnd = Math.min(props.page * props.pageSize, props.total);

  return (
    <div className="space-y-4">
      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border p-1">
          {TABS.map((tab) => {
            const count = tab.value === "all" ? undefined : props.counts[tab.value as ReviewStatus];
            return (
              <button
                key={tab.value}
                onClick={() => updateParams({ status: tab.value, page: null })}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  props.status === tab.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className="rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews…" className="pl-9" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {props.rows.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews here"
          description={props.status === "pending" ? "The moderation queue is clear." : "Nothing matches this view."}
        />
      ) : (
        <div className="space-y-3">
          {props.rows.map((review) => {
            const rowBusy = busyId === review.id && isPending;
            return (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating rating={review.rating} />
                      {review.verified_purchase && (
                        <Badge variant="success" className="gap-1">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {review.featured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3 fill-current" /> Featured
                        </Badge>
                      )}
                      {review.status === "approved" && <Badge variant="success">Approved</Badge>}
                      {review.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                      {review.status === "pending" && <Badge variant="warning">Pending</Badge>}
                    </div>
                    {review.title && <p className="text-sm font-semibold">{review.title}</p>}
                    <p className="text-sm text-muted-foreground">{review.body || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {fullName(review.author_name, "", review.author_email ?? "Anonymous")} · {review.product_name} ·{" "}
                      {dateShort(review.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {review.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rowBusy}
                        onClick={() => run(review.id, () => setReviewStatus(review.id, "approved"), "Review approved.")}
                      >
                        {rowBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={rowBusy}
                        onClick={() => run(review.id, () => setReviewStatus(review.id, "rejected"), "Review rejected.")}
                      >
                        <Ban className="h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                    {review.status === "approved" && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={review.featured ? "Unfeature" : "Feature"}
                        disabled={rowBusy}
                        onClick={() =>
                          run(
                            review.id,
                            () => toggleReviewFeatured(review.id, !review.featured),
                            review.featured ? "Unfeatured." : "Featured."
                          )
                        }
                      >
                        <Star className={cn("h-4 w-4", review.featured && "fill-amber-400 text-amber-400")} />
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Delete review"
                      disabled={rowBusy}
                      onClick={() => setDeleting(review)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{props.total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${props.total}`}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={props.page <= 1 || isPending} onClick={() => updateParams({ page: String(props.page - 1) })}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="tabular-nums">Page {props.page} / {props.pageCount}</span>
          <Button variant="outline" size="sm" disabled={props.page >= props.pageCount || isPending} onClick={() => updateParams({ page: String(props.page + 1) })}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete review?"
        description="This permanently removes the review. This can't be undone."
        confirmLabel="Delete review"
        destructive
        loading={isPending}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          run(id, () => deleteReview(id), "Review deleted.");
          setDeleting(null);
        }}
      />
    </div>
  );
}
