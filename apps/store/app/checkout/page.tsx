import Link from "next/link";
import { LumaDeskCheckoutElements } from "@/components/checkout/checkout-elements";

type CheckoutPageProps = {
  searchParams: Promise<{ variantSlug?: string; quantity?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { variantSlug, quantity: rawQuantity } = await searchParams;
  const quantity = Number(rawQuantity);
  const isValidQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= 10;

  if (!variantSlug || !isValidQuantity) {
    return (
      <main className="checkout-page">
        <section className="checkout-panel checkout-invalid">
          <Link className="checkout-brand" href="/">Luma<span>Desk</span></Link>
          <p className="eyebrow">CHECKOUT</p>
          <h1>Your bag needs a configuration.</h1>
          <p>Choose your desk finish and frame before continuing to checkout.</p>
          <Link className="checkout-back" href="/#shop">Return to configurator</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link className="checkout-brand" href="/">Luma<span>Desk</span></Link>
        <Link className="checkout-return" href="/#shop">← Edit configuration</Link>
      </header>
      <section className="checkout-layout">
        <aside className="checkout-intro">
          <h1>Complete your order.</h1>
          <div className="checkout-order-line">
            <strong>LumaDesk Pro</strong>
            <span>Made to order · Complimentary delivery · 30-day trial</span>
          </div>
        </aside>
        <section className="checkout-form-flow" aria-label="Secure payment form">
          <LumaDeskCheckoutElements variantSlug={variantSlug} quantity={quantity} />
        </section>
      </section>
    </main>
  );
}
