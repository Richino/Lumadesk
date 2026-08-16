"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type CheckoutElementsProps = {
  variantSlug: string;
  quantity: number;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const appearance: Appearance = {
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
    fontSizeBase: "14px",
    fontSizeSm: "11px",
    fontWeightMedium: "600",
    spacingGridRow: "10px",
    spacingGridColumn: "12px",
    spacingUnit: "4px",
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
      border: "1px solid #CFCBC3",
      boxShadow: "none",
      color: "#111111",
      fontSize: "14px",
      padding: "10px 13px",
      transition: "border-color 150ms ease, box-shadow 150ms ease",
    },
    ".Input:hover": { borderColor: "#9D988F" },
    ".Input:focus": {
      borderColor: "#111111",
      boxShadow: "0 0 0 1px #111111",
      outline: "none",
    },
    ".Input--invalid": {
      borderColor: "#8A2727",
      boxShadow: "0 0 0 1px #8A2727",
    },
    ".Label": {
      color: "#111111",
      fontFamily: "DM Mono, monospace",
      fontSize: "10px",
      fontWeight: "500",
      letterSpacing: "0.08em",
      marginBottom: "5px",
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
    ".CheckboxLabel": { color: "#67645E", fontSize: "12px" },
    ".Error": { color: "#8A2727", fontSize: "11px" },
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

  async function submit(event: FormEvent<HTMLFormElement>) {
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
        <ContactDetailsElement />
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>02</span><h2>Delivery</h2></div>
        <ShippingAddressElement options={{ display: { name: "split" } }} />
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>03</span><h2>Billing</h2></div>
        <BillingAddressElement options={{ display: { name: "split" } }} />
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading"><span>04</span><h2>Payment</h2></div>
        <PaymentElement
          options={{
            layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
            paymentMethodOrder: ["card"],
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            terms: { card: "never" },
          }}
        />
      </section>

      {error && <p className="checkout-error" role="alert">{error}</p>}

      <button className="checkout-pay" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        <span>{isSubmitting ? "Processing payment…" : `Pay ${checkout.total.total.amount}`}</span>
      </button>
      <p className="checkout-powered">Encrypted card payment · Powered by Stripe</p>
    </form>
  );
}

function CheckoutElementsClient({ variantSlug, quantity }: CheckoutElementsProps) {
  const options = useMemo<StripeCheckoutElementsSdkOptions>(() => ({
    clientSecret: fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantSlug, quantity }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout could not be prepared.");
      return data.clientSecret as string;
    }),
    elementsOptions: {
      appearance,
      loader: "auto",
      syncAddressCheckbox: "billing",
      fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" }],
    },
  }), [quantity, variantSlug]);

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
