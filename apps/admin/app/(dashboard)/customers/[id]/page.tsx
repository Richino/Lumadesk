import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Mail, MapPin, Receipt, ShoppingCart, Wallet, Bell } from "lucide-react";
import { getCustomerDetail } from "@/lib/queries/customers";
import { money, dateShort, dateTime, fullName, initials, relativeTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  return { title: detail ? fullName(detail.customer.first_name, detail.customer.last_name, detail.customer.email) : "Customer" };
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const { customer, orders, addresses, stats } = detail;

  return (
    <div className="space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-14 w-14">
          {customer.avatar_url && <AvatarImage src={customer.avatar_url} alt="" />}
          <AvatarFallback className="text-base">
            {initials(customer.first_name, customer.last_name, customer.email)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {fullName(customer.first_name, customer.last_name, "Unnamed customer")}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {customer.email}
            </span>
            <span>·</span>
            <span>Joined {dateShort(customer.created_at)}</span>
            {customer.marketing_emails && (
              <Badge variant="muted" className="gap-1">
                <Bell className="h-3 w-3" /> Marketing opt-in
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lifetime spend" value={money(stats.lifetime_spend)} icon={Wallet} />
        <StatCard label="Orders" value={String(stats.order_count)} icon={ShoppingCart} />
        <StatCard label="Avg order" value={money(stats.avg_order)} icon={Receipt} />
        <StatCard
          label="Last order"
          value={stats.last_order_at ? relativeTime(stats.last_order_at) : "—"}
          icon={ShoppingCart}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Order history</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {orders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No orders yet" className="border-0" />
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{dateTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="w-20 text-right text-sm font-medium tabular-nums">{money(order.total_cents)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses + contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses.</p>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">{address.full_name}</span>
                      {address.is_default && <Badge variant="muted">Default</Badge>}
                    </div>
                    <address className="not-italic leading-relaxed text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.state} {address.postal_code}
                      {address.phone ? <><br />{address.phone}</> : null}
                    </address>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
