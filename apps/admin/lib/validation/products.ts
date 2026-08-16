import { z } from "zod";

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(140)
    .regex(slugPattern, "Use lowercase letters, numbers, and dashes"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(140),
  finish: z.string().trim().min(1, "Finish is required").max(80),
  frame: z.string().trim().min(1, "Frame is required").max(80),
  price_cents: z.coerce.number().int("Whole cents only").positive("Price must be greater than zero"),
  image_path: z.string().trim().min(1).max(300),
  inventory_quantity: z.coerce.number().int().min(0, "Cannot be negative"),
  active: z.boolean(),
});

export type VariantFormValues = z.infer<typeof variantSchema>;

/** Build a URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
