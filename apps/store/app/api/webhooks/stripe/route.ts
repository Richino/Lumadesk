import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendOrderConfirmation } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") throw new Error("Checkout session has not been paid.");

  const variantId = session.metadata?.variant_id;
  const quantity = Number(session.metadata?.quantity ?? 0);
  const unitPriceCents = Number(session.metadata?.unit_price_cents ?? 0);
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  if (!variantId || !Number.isInteger(quantity) || quantity < 1 || !Number.isInteger(unitPriceCents) || unitPriceCents < 1 || !email) {
    throw new Error("Invalid checkout metadata.");
  }

  const total = session.amount_total ?? 0;
  const subtotal = session.amount_subtotal ?? 0;
  const tax = session.total_details?.amount_tax ?? 0;
  const shipping = Math.max(0, total - subtotal - tax);
  const admin = createServiceRoleClient();
  const { data: orderId, error } = await admin.rpc("fulfill_checkout_order", {
    p_session_id: session.id,
    p_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    p_user_id: session.metadata?.user_id || null,
    p_email: email,
    p_variant_id: variantId,
    p_quantity: quantity,
    p_unit_price_cents: unitPriceCents,
    p_subtotal_cents: subtotal,
    p_tax_cents: tax,
    p_shipping_cents: shipping,
    p_total_cents: total,
    p_shipping_address: session.collected_information?.shipping_details?.address ?? null,
  });
  if (error || !orderId) throw new Error("Unable to fulfill checkout order.");

  const { data: order, error: orderError } = await admin.from("orders").select("confirmation_number").eq("id", orderId).single();
  if (orderError || !order?.confirmation_number) throw new Error("Unable to load order confirmation.");
  await sendOrderConfirmation({ to: email, confirmationNumber: order.confirmation_number, totalCents: total });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  if (!signature) return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return NextResponse.json({ received: true });

  try { await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session); }
  catch (error) {
    console.error("Stripe checkout fulfillment failed", { eventId: event.id, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Unable to fulfill order." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
