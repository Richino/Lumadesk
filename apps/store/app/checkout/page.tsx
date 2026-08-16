import Link from "next/link";
import { LumaDeskCheckoutElements } from "@/components/checkout/checkout-elements";

type CheckoutPageProps = {
  searchParams: Promise<{ items?: string }>;
};

type CheckoutItem = { variantSlug: string; quantity: number };

// Items arrive as a compact `slug:qty,slug:qty` string from the bag. Any
// malformed entry invalidates the whole request so checkout never starts with
// a partial or tampered configuration.
function parseItems(raw: string | undefined): CheckoutItem[] {
  if (!raw) return [];
  const items: CheckoutItem[] = [];
  for (const part of raw.split(",")) {
    const [slug, rawQuantity] = part.split(":");
    const quantity = Number(rawQuantity);
    if (
      !slug ||
      !/^[a-z0-9-]+$/.test(slug) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      return [];
    }
    items.push({ variantSlug: slug, quantity });
  }
  return items.slice(0, 20);
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { items: raw } = await searchParams;
  const items = parseItems(raw);

  if (!items.length) {
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
            <strong>LumaDesk Pro{itemCount > 1 ? ` · ${itemCount} desks` : ""}</strong>
            <span>Made to order · Complimentary delivery · 30-day trial</span>
          </div>
        </aside>
        <section className="checkout-form-flow" aria-label="Secure payment form">
          <LumaDeskCheckoutElements items={items} />
        </section>
      </section>
    </main>
  );
}
