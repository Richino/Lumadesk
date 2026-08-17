import { z } from "zod";

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, dashes, or underscores"),
    description: z.string().trim().max(200).default(""),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().positive("Value must be greater than zero"),
    min_purchase_cents: z.coerce.number().int().min(0).default(0),
    usage_limit: z.union([z.coerce.number().int().positive(), z.null()]).default(null),
    starts_at: z.union([z.string(), z.null()]).default(null),
    expires_at: z.union([z.string(), z.null()]).default(null),
    active: z.boolean().default(true),
  })
  .refine((data) => data.type !== "percent" || data.value <= 100, {
    message: "A percentage can't exceed 100",
    path: ["value"],
  })
  .refine(
    (data) => !data.starts_at || !data.expires_at || new Date(data.starts_at) < new Date(data.expires_at),
    { message: "Start must be before expiry", path: ["expires_at"] }
  );

export type CouponFormValues = z.infer<typeof couponSchema>;

export type CouponComputedStatus = "active" | "scheduled" | "expired" | "used-up" | "disabled";

export function couponStatus(coupon: {
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
}): CouponComputedStatus {
  if (!coupon.active) return "disabled";
  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return "scheduled";
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) return "expired";
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) return "used-up";
  return "active";
}
