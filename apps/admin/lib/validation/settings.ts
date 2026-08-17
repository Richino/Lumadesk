import { z } from "zod";

export const settingsSchema = z.object({
  store_name: z.string().trim().min(1, "Store name is required").max(120),
  support_email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  phone: z.string().trim().max(40).default(""),
  business_address: z
    .object({
      line1: z.string().trim().max(120).optional(),
      line2: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      postal_code: z.string().trim().max(16).optional(),
      country: z.string().trim().max(60).optional(),
    })
    .default({}),
  flat_shipping_cents: z.coerce.number().int().min(0),
  free_shipping_threshold_cents: z.union([z.coerce.number().int().min(0), z.null()]).default(null),
  tax_rate_bps: z.coerce.number().int().min(0).max(10000),
  order_confirmation_template: z.string().max(5000).default(""),
  shipping_notification_template: z.string().max(5000).default(""),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
