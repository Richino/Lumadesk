import type { OrderStatus } from "@/lib/types";

export type StatusMeta = {
  label: string;
  /** Tailwind classes for the status badge (dark surface). */
  className: string;
  dot: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  paid: {
    label: "Paid",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
  },
  processing: {
    label: "Processing",
    className: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
    dot: "bg-indigo-400",
  },
  fulfilled: {
    label: "Fulfilled",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-zinc-500/25 bg-zinc-500/10 text-zinc-300",
    dot: "bg-zinc-400",
  },
  refunded: {
    label: "Refunded",
    className: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

/**
 * Allowed forward transitions for the fulfillment workflow. Refund/cancel are
 * handled as explicit destructive actions rather than free-form dropdowns.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "refunded", "cancelled"],
  processing: ["fulfilled", "refunded", "cancelled"],
  fulfilled: ["refunded"],
  cancelled: [],
  refunded: [],
};

/** Statuses that count toward realized revenue. */
export const REVENUE_STATUSES: OrderStatus[] = ["paid", "processing", "fulfilled"];

/** Orders in these statuses reserve stock but haven't shipped. */
export const RESERVING_STATUSES: OrderStatus[] = ["pending", "paid", "processing"];
