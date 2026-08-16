import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";

const input = z.object({
  items: z
    .array(z.object({ variantSlug: z.string().min(1).max(120), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const body = input.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });

  // Collapse duplicate configurations so inventory is checked against the true
  // combined quantity rather than each line in isolation.
  const wanted = new Map<string, number>();
  for (const item of body.data.items) {
    wanted.set(item.variantSlug, Math.min(10, (wanted.get(item.variantSlug) ?? 0) + item.quantity));
  }

  try {
    const admin = createServiceRoleClient();
    const { data: variants, error } = await admin
      .from("product_variants")
      .select("id, name, slug, price_cents, currency, inventory_quantity, active")
      .in("slug", [...wanted.keys()]);
    if (error) return NextResponse.json({ error: "This configuration is unavailable." }, { status: 409 });

    const bySlug = new Map((variants ?? []).map((variant) => [variant.slug, variant]));
    const lines: { variant: NonNullable<typeof variants>[number]; quantity: number }[] = [];
    for (const [slug, quantity] of wanted) {
      const variant = bySlug.get(slug);
      if (!variant || !variant.active || variant.inventory_quantity < quantity) {
        return NextResponse.json({ error: "This configuration is unavailable." }, { status: 409 });
      }
      lines.push({ variant, quantity });
    }

    const currency = lines[0].variant.currency;
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
      shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: 0, currency }, display_name: "Complimentary white-glove delivery" } }],
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: { currency: line.variant.currency, unit_amount: line.variant.price_cents, product_data: { name: `LumaDesk Pro — ${line.variant.name}` } },
      })),
      metadata: {
        // Compact per-line mapping the webhook expands into order_items. Only
        // real, in-stock variants reach here, so this stays well under Stripe's
        // 500-character metadata limit.
        items: JSON.stringify(lines.map((line) => ({ v: line.variant.id, q: line.quantity, p: line.variant.price_cents }))),
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
