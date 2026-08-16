import { EmptyState } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Order = { id: string; confirmation_number: string | null; status: string; total_cents: number; created_at: string; order_items: Array<{ product_name: string; variant_name: string; quantity: number }> };
const orderFields = "id, confirmation_number, status, total_cents, created_at, order_items(product_name, variant_name, quantity)";

export default async function OrdersPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: accountOrders }, { data: guestOrders }] = await Promise.all([
    supabase.from("orders").select(orderFields).eq("user_id", user.id).order("created_at", { ascending: false }),
    createServiceRoleClient().from("orders").select(orderFields).is("user_id", null).eq("email", user.email).order("created_at", { ascending: false }),
  ]);
  const orders = [...(accountOrders ?? []), ...(guestOrders ?? [])]
    .filter((order, index, items) => items.findIndex((item) => item.id === order.id) === index)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Order[];

  if (!orders.length) return <EmptyState title="No orders yet." copy="The moment you choose your desk, we will keep every detail of its journey here." />;
  return <><p className="eyebrow">ORDERS</p><h2 className="account-title">Your LumaDesk journey.</h2><div className="settings-stack">{orders.map((order) => <section className="settings-card" key={order.id}><p className="eyebrow">{order.status.toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}</p><h2>${(order.total_cents / 100).toFixed(2)}</h2><p>{order.confirmation_number ? `Confirmation ${order.confirmation_number}` : "Confirmation being prepared"}</p><p>{order.order_items.map((item) => `${item.product_name} — ${item.variant_name} × ${item.quantity}`).join(", ")}</p></section>)}</div></>;
}
