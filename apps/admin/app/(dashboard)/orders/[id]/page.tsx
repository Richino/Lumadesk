import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Printer, FileText, Mail, User, MapPin, CreditCard } from "lucide-react";
import { getOrderDetail } from "@/lib/queries/orders";
import { money, dateTime, fullName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderWorkflow } from "@/components/orders/order-workflow";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderTrackingCard, OrderNotesCard } from "@/components/orders/order-fulfillment";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${id.slice(0, 8)}` };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();

  const { order, items, events, customer } = detail;
  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl font-semibold tracking-tight">#{order.id.slice(0, 8)}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">Placed {dateTime(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/orders/${order.id}/invoice`} target="_blank">
                <FileText className="h-4 w-4" /> Invoice
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/orders/${order.id}/packing-slip`} target="_blank">
                <Printer className="h-4 w-4" /> Packing slip
              </Link>
            </Button>
            <OrderWorkflow orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.product_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.variant_name}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="tabular-nums text-muted-foreground">
                        {money(item.unit_price_cents)} × {item.quantity}
                      </span>
                      <span className="w-20 text-right font-medium tabular-nums">
                        {money(item.unit_price_cents * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{money(order.subtotal_cents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="tabular-nums">{money(order.shipping_cents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular-nums">{money(order.tax_cents)}</dd>
                </div>
                <Separator className="my-1.5" />
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(order.total_cents)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline events={events} createdAt={order.created_at} />
            </CardContent>
          </Card>
        </div>

        {/* Right: customer, address, payment, tracking, notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">
                  {customer ? fullName(customer.first_name, customer.last_name, order.email) : "Guest checkout"}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {order.email}
                </p>
              </div>
              {customer && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/customers/${customer.id}`}>View customer</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Shipping address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {address ? (
                <address className="not-italic leading-relaxed text-muted-foreground">
                  <span className="block font-medium text-foreground">{address.full_name}</span>
                  {address.line1}
                  {address.line2 ? <>, {address.line2}</> : null}
                  <br />
                  {address.city}, {address.state} {address.postal_code}
                  <br />
                  {address.country_code}
                  {address.phone ? <><br />{address.phone}</> : null}
                </address>
              ) : (
                <p className="text-muted-foreground">No shipping address on file.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium tabular-nums">{money(order.total_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <OrderStatusBadge status={order.status} />
              </div>
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Stripe PI</span>
                  <span className="truncate font-mono text-xs">{order.stripe_payment_intent_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <OrderTrackingCard orderId={order.id} carrier={order.carrier} trackingNumber={order.tracking_number} />
          <OrderNotesCard orderId={order.id} notes={order.internal_notes} />
        </div>
      </div>
    </div>
  );
}
