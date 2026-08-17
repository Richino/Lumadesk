"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import {
  CheckoutElementsProvider,
  BillingAddressElement,
  ContactDetailsElement,
  PaymentElement,
  ShippingAddressElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import type { Appearance, StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";

type CheckoutItem = { variantSlug: string; quantity: number };

type CheckoutElementsProps = {
  items: CheckoutItem[];
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Card fields live inside Stripe's iframe, so the storefront's "render at 16px,
// scale back to 14px" trick (globals.css, @media pointer: coarse) can't reach
// them from the outside. We reproduce it here instead: on touch devices every
// length in the appearance is multiplied by 8/7 so inputs render at a real 16px
// (which keeps iOS Safari from zooming on focus), then the field wrapper is
// scaled by 7/8 in checkout.css so the whole block looks identical to the 14px
// design. Desktop (fine pointer) uses the true sizes with no scaling.
const TOUCH_FONT_SCALE = 8 / 7;

function buildAppearance(coarse: boolean): Appearance {
  const m = coarse ? TOUCH_FONT_SCALE : 1;
  const px = (n: number) => `${Math.round(n * m * 1000) / 1000}px`;

  return {
    theme: "flat",
    labels: "above",
    variables: {
      borderRadius: "0px",
      colorBackground: "#F6F5F1",
      colorDanger: "#8A2727",
      colorPrimary: "#111111",
      colorText: "#111111",
      colorTextSecondary: "#67645E",
      colorTextPlaceholder: "#8B877F",
      fontFamily: "Inter, Arial, sans-serif",
      fontSizeBase: px(14),
      fontSizeSm: px(11),
      fontWeightMedium: "600",
      spacingGridRow: px(10),
      spacingGridColumn: px(12),
      spacingUnit: px(4),
    },
    rules: {
      ".Block": {
        backgroundColor: "transparent",
        border: "0",
        boxShadow: "none",
        padding: "0",
      },
      ".Input": {
        backgroundColor: "#FFFFFF",
        border: `${px(1)} solid #CFCBC3`,
        boxShadow: "none",
        color: "#111111",
        fontSize: px(14),
        padding: `${px(10)} ${px(13)}`,
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      },
      ".Input:hover": { borderColor: "#9D988F" },
      ".Input:focus": {
        borderColor: "#111111",
        boxShadow: `0 0 0 ${px(1)} #111111`,
        outline: "none",
      },
      ".Input--invalid": {
        borderColor: "#8A2727",
        boxShadow: `0 0 0 ${px(1)} #8A2727`,
      },
      ".Label": {
        color: "#111111",
        fontFamily: "DM Mono, monospace",
        fontSize: px(10),
        fontWeight: "500",
        letterSpacing: "0.08em",
        marginBottom: px(5),
        textTransform: "uppercase",
      },
      ".AccordionItem": {
        backgroundColor: "transparent",
        border: "0",
        boxShadow: "none",
        padding: "0",
      },
      ".AccordionItem--selected": {
        backgroundColor: "transparent",
        border: "0",
        boxShadow: "none",
      },
      ".CheckboxInput": {
        backgroundColor: "#FFFFFF",
        borderColor: "#A9A49A",
        borderRadius: "0",
      },
      ".CheckboxInput--checked": {
        backgroundColor: "#111111",
        borderColor: "#111111",
      },
      ".CheckboxLabel": { color: "#67645E", fontSize: px(12) },
      ".Error": { color: "#8A2727", fontSize: px(11) },
      ".Tab": {
        backgroundColor: "#FFFFFF",
        borderColor: "#CFCBC3",
        borderRadius: "0",
        boxShadow: "none",
      },
      ".Tab--selected": {
        backgroundColor: "#111111",
        borderColor: "#111111",
        color: "#FFFFFF",
      },
    },
  };
}

function CheckoutForm() {
  const checkoutResult = useCheckoutElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checkoutResult.type === "loading") {
    return <div className="checkout-elements-loading" aria-label="Loading secure checkout"><i /><i /><i /></div>;
  }

  if (checkoutResult.type === "error") {
    return <p className="checkout-error" role="alert">{checkoutResult.error.message}</p>;
  }

  const { checkout } = checkoutResult;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let timeout: number | undefined;
    try {
      const validation = await checkout.validateElements();
      if (validation.type === "error") {
        setError(validation.error.message || "Please complete the highlighted fields.");
        return;
      }

      const confirmation = await Promise.race([
        checkout.confirm({
          redirect: "if_required",
        }),
        new Promise<never>((_, reject) => {
          timeout = window.setTimeout(() => reject(new Error("Payment confirmation timed out.")), 45_000);
        }),
      ]);

      if (confirmation.type === "error") {
        setError(confirmation.error.message || "Your payment could not be completed.");
        return;
      }
      window.location.assign(`/order-confirmed?session_id=${confirmation.session.id}`);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "";
      console.error("Stripe Checkout confirmation failed", caught);
      setError(detail || "We could not confirm your payment. Please check your payment status before trying again.");
    } finally {
      if (timeout) window.clearTimeout(timeout);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="checkout-elements-form" onSubmit={submit}>
      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>01</span><h2>Contact</h2></div>
        <div className="checkout-stripe-field"><ContactDetailsElement /></div>
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>02</span><h2>Delivery</h2></div>
        <div className="checkout-stripe-field"><ShippingAddressElement options={{ display: { name: "split" } }} /></div>
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>03</span><h2>Billing</h2></div>
        <div className="checkout-stripe-field"><BillingAddressElement options={{ display: { name: "split" } }} /></div>
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>04</span><h2>Payment</h2></div>
        <div className="checkout-stripe-field">
          <PaymentElement
            options={{
              layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
              paymentMethodOrder: ["card"],
              wallets: { applePay: "never", googlePay: "never", link: "never" },
              terms: { card: "never" },
            }}
          />
        </div>
      </section>

      {error && <p className="checkout-error" role="alert">{error}</p>}

      <button className="checkout-pay" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        <span>{isSubmitting ? "Processing payment…" : `Pay ${checkout.total.total.amount}`}</span>
      </button>
      <p className="checkout-powered">Encrypted card payment · Powered by Stripe</p>
    </form>
  );
}

function CheckoutElementsClient({ items }: CheckoutElementsProps) {
  const itemsKey = JSON.stringify(items);
  // Matches the storefront's @media (pointer: coarse) rule so the appearance
  // (built here in JS) and the field scaling (applied in CSS) always agree.
  const coarse = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );
  const options = useMemo<StripeCheckoutElementsSdkOptions>(() => ({
    clientSecret: fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout could not be prepared.");
      return data.clientSecret as string;
    }),
    elementsOptions: {
      appearance: buildAppearance(coarse),
      loader: "auto",
      syncAddressCheckbox: "billing",
      fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" }],
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [itemsKey, coarse]);

  if (!stripePromise) {
    return <p className="checkout-error">Checkout is unavailable because the Stripe publishable key is missing.</p>;
  }

  return <CheckoutElementsProvider stripe={stripePromise} options={options}><CheckoutForm /></CheckoutElementsProvider>;
}

export function LumaDeskCheckoutElements(props: CheckoutElementsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return <div className="checkout-elements-loading" aria-label="Loading secure checkout"><i /><i /><i /></div>;
  }

  return <CheckoutElementsClient {...props} />;
}
