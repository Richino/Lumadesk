import { format, formatDistanceToNow } from "date-fns";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact" });
const plainNumber = new Intl.NumberFormat("en-US");

/** Cents → "$1,895.00". */
export function money(cents: number | null | undefined): string {
  return usd.format((cents ?? 0) / 100);
}

/** Cents → "$1,895" (no decimals) for dense KPI tiles. */
export function moneyWhole(cents: number | null | undefined): string {
  return usdWhole.format((cents ?? 0) / 100);
}

export function compact(n: number | null | undefined): string {
  return compactNumber.format(n ?? 0);
}

export function number(n: number | null | undefined): string {
  return plainNumber.format(n ?? 0);
}

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** "Aug 16, 2026" */
export function dateShort(input: string | Date): string {
  return format(new Date(input), "MMM d, yyyy");
}

/** "Aug 16, 2026 · 2:14 PM" */
export function dateTime(input: string | Date): string {
  return format(new Date(input), "MMM d, yyyy · h:mm a");
}

/** "3 hours ago" */
export function relativeTime(input: string | Date): string {
  return formatDistanceToNow(new Date(input), { addSuffix: true });
}

export function initials(first?: string | null, last?: string | null, email?: string | null): string {
  const a = (first ?? "").trim();
  const b = (last ?? "").trim();
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || "?";
  return (email ?? "?").charAt(0).toUpperCase();
}

export function fullName(first?: string | null, last?: string | null, fallback = "—"): string {
  const name = `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
  return name || fallback;
}
