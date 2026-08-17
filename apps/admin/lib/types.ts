// Domain types mirroring the Supabase schema (public.*). Kept intentionally
// close to the DB shape so query results map without adapters.

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export type UserRole = "customer" | "admin";

export type InventoryReason =
  | "restock"
  | "adjustment"
  | "sale"
  | "return"
  | "correction"
  | "damage"
  | "initial";

export type ShippingAddress = {
  full_name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  finish: string;
  frame: string;
  price_cents: number;
  currency: string;
  image_path: string;
  active: boolean;
  inventory_quantity: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  carrier: string | null;
  internal_notes: string | null;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string;
  unit_price_cents: number;
  quantity: number;
  created_at: string;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  actor_id: string | null;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  marketing_emails: boolean;
  order_updates: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: string;
  variant_id: string;
  actor_id: string | null;
  delta: number;
  reason: InventoryReason;
  note: string | null;
  resulting_quantity: number;
  order_id: string | null;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  product_id: string;
  variant_id: string | null;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verified_purchase: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type CouponType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  min_purchase_cents: number;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CouponRedemption = {
  id: string;
  coupon_id: string;
  order_id: string | null;
  user_id: string | null;
  amount_cents: number;
  created_at: string;
};
