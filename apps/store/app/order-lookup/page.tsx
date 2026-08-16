import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type OrderLookupPageProps = { searchParams: Promise<{ confirmation?: string | string[]; email?: string | string[] }> };
type LookupOrder = { confirmation_number: string; status: string; total_cents: number; currency: string; created_at: string; order_items: Array<{ product_name: string; variant_name: string; quantity: number }> };

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function OrderLookupPage({ searchParams }: OrderLookupPageProps) {
  const query = await searchParams;
  const confirmation = first(query.confirmation)?.trim().toUpperCase() ?? "";
  const email = first(query.email)?.trim().toLowerCase() ?? "";
  const submitted = Boolean(confirmation || email);
  let order: LookupOrder | null = null;

  if (/^LD-[A-F0-9]{10}$/.test(confirmation) && /^\S+@\S+\.\S+$/.test(email)) {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("orders")
      .select("confirmation_number, status, total_cents, currency, created_at, order_items(product_name, variant_name, quantity)")
      .eq("confirmation_number", confirmation)
      .eq("email", email)
      .maybeSingle();
    order = data as LookupOrder | null;
  }

  return (
    <main className="auth-page order-lookup-page">
      <Link className="brand auth-brand" href="/">Luma<span>Desk</span></Link>
      <section className="auth-card order-lookup-card">
        <p className="eyebrow">ORDER LOOKUP</p>
        <h1>Find your order.</h1>
        <p className="auth-intro">Enter the confirmation number from your email and the address used at checkout.</p>
        <form className="auth-form" method="get">
          <label className="auth-field" htmlFor="confirmation">Confirmation number
            <input id="confirmation" name="confirmation" defaultValue={confirmation} placeholder="LD-XXXXXXXXXX" autoCapitalize="characters" required />
          </label>
          <label className="auth-field" htmlFor="email">Email address
            <input id="email" name="email" type="email" defaultValue={email} autoComplete="email" required />
          </label>
          <button className="auth-submit" type="submit">Find order</button>
        </form>
        {order ? (
          <section className="order-lookup-result" aria-live="polite">
            <p className="eyebrow">{order.status.toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}</p>
            <h2>{order.confirmation_number}</h2>
            <p>{order.order_items.map((item) => `${item.product_name} — ${item.variant_name} × ${item.quantity}`).join(", ")}</p>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency.toUpperCase() }).format(order.total_cents / 100)}</strong>
          </section>
        ) : submitted ? <p className="auth-notice" aria-live="polite">We could not find an order with those details. Check both fields and try again.</p> : null}
        <Link className="auth-shopping" href="/">Return to LumaDesk</Link>
      </section>
    </main>
  );
}
