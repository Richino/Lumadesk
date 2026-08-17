import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/types";

const DEFAULTS: StoreSettings = {
  id: true,
  store_name: "LumaDesk",
  support_email: "",
  phone: "",
  business_address: {},
  currency: "usd",
  flat_shipping_cents: 0,
  free_shipping_threshold_cents: null,
  tax_rate_bps: 0,
  order_confirmation_template: "",
  shipping_notification_template: "",
  updated_at: new Date().toISOString(),
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();
  return { ...DEFAULTS, ...(data ?? {}) } as StoreSettings;
}

/** Which integration secrets are configured (never exposes the values). */
export function getIntegrationStatus() {
  return [
    { key: "Supabase URL", env: "NEXT_PUBLIC_SUPABASE_URL", configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    {
      key: "Supabase publishable key",
      env: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    { key: "Supabase service role", env: "SUPABASE_SERVICE_ROLE_KEY", configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: "Stripe secret key", env: "STRIPE_SECRET_KEY", configured: !!process.env.STRIPE_SECRET_KEY },
    {
      key: "Stripe publishable key",
      env: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      configured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
    { key: "Resend API key", env: "RESEND_API_KEY", configured: !!process.env.RESEND_API_KEY },
  ];
}
