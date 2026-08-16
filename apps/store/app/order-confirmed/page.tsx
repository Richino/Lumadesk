import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";
import { ClearCart } from "@/components/checkout/clear-cart";

type OrderConfirmedPageProps = { searchParams: Promise<{ session_id?: string }> };

function receiptCopy(email: string | null) {
  if (email) return `Your receipt was sent to ${email}.`;
  return "Your confirmation email will follow.";
}

export default async function OrderConfirmedPage({
  searchParams,
}: OrderConfirmedPageProps) {
  const sessionId = (await searchParams).session_id;
  let state: "confirmed" | "payment_received" | "processing" | "invalid" =
    "invalid";
  let confirmationNumber: string | null = null;
  let receiptEmail: string | null = null;

  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      receiptEmail =
        session.customer_details?.email ?? session.customer_email ?? null;
      if (session.status === "complete" && session.payment_status === "paid") {
        const admin = createServiceRoleClient();
        const { data: order } = await admin
          .from("orders")
          .select("confirmation_number, email")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();
        if (order?.confirmation_number) {
          state = "confirmed";
          confirmationNumber = order.confirmation_number;
          receiptEmail = order.email || receiptEmail;
        } else state = "payment_received";
      } else if (
        session.status === "open" ||
        session.payment_status === "unpaid"
      ) {
        state = "processing";
      }
    } catch {
      state = "invalid";
    }
  }

  const copy =
    state === "confirmed"
      ? {
          eyebrow: "ORDER CONFIRMED",
          title: "Your LumaDesk is in motion.",
          body: receiptCopy(receiptEmail),
        }
      : state === "payment_received"
        ? {
            eyebrow: "PAYMENT RECEIVED",
            title: "Your payment was successful.",
            body: "We’re finalizing your order now—please don’t pay again. Your confirmation email will follow as soon as it’s ready.",
          }
        : state === "processing"
          ? {
              eyebrow: "PAYMENT PROCESSING",
              title: "We’re waiting for payment confirmation.",
              body: "Please keep this page open while your bank confirms the payment. We will create your order only after Stripe confirms it.",
            }
          : {
              eyebrow: "ORDER STATUS",
              title: "We couldn’t confirm this order.",
              body: "Use the link from your payment confirmation email, or return to LumaDesk to begin checkout again.",
            };

  const paymentSucceeded = state === "confirmed" || state === "payment_received";

  return (
    <main className="auth-page">
      {paymentSucceeded && <ClearCart />}
      <section className="auth-card">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="auth-intro">{copy.body}</p>
        {confirmationNumber && (
          <p className="auth-notice">
            <strong>Confirmation number: {confirmationNumber}</strong>
          </p>
        )}
        {confirmationNumber && (
          <Link
            className="auth-shopping"
            href={`/order-lookup?confirmation=${encodeURIComponent(confirmationNumber)}`}
          >
            Look up this order
          </Link>
        )}
        <Link className="auth-submit" href="/">
          Return to LumaDesk
        </Link>
      </section>
    </main>
  );
}
