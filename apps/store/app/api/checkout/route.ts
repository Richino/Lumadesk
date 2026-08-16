import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";

const input = z.object({ variantSlug: z.string().min(1).max(120), quantity: z.number().int().min(1).max(10) });

export async function POST(request: Request) {
  const body = input.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });

  try {
    const admin = createServiceRoleClient();
    const { data: variant, error } = await admin.from("product_variants").select("id, name, price_cents, currency, inventory_quantity, active").eq("slug", body.data.variantSlug).single();
    if (error || !variant?.active || variant.inventory_quantity < body.data.quantity) return NextResponse.json({ error: "This configuration is unavailable." }, { status: 409 });

    const { data: claims } = await (await createClient()).auth.getClaims();
    const origin = new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      // This is deliberately an explicit list, not Stripe's dynamic payment
      // methods. LumaDesk's checkout is card-only for the portfolio demo.
      payment_method_types: ["card"],
      wallet_options: { link: { display: "never" } },
      customer_creation: "always",
      allow_promotion_codes: false,
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },
      // This portfolio checkout does not collect tax. Enable Stripe Tax only
      // after the business address and tax registrations are configured.
      shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: 0, currency: variant.currency }, display_name: "Complimentary white-glove delivery" } }],
      line_items: [{ quantity: body.data.quantity, price_data: { currency: variant.currency, unit_amount: variant.price_cents, product_data: { name: `LumaDesk Pro — ${variant.name}` } } }],
      metadata: {
        variant_id: variant.id,
        quantity: String(body.data.quantity),
        unit_price_cents: String(variant.price_cents),
        user_id: claims?.claims?.sub ?? "",
      },
      // Checkout Elements keeps the Checkout Session and webhook lifecycle,
      // but lets the storefront compose and theme each secure field itself.
      ui_mode: "elements",
      return_url: `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    });
    if (!session.client_secret) return NextResponse.json({ error: "Unable to start checkout." }, { status: 502 });
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
