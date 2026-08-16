import Link from "next/link";
import type { Metadata } from "next";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Package,
  PlusCircle,
  ArrowUpRight,
  Boxes,
} from "lucide-react";
import { getDashboardData } from "@/lib/queries/dashboard";
import { money, moneyWhole, number as fmtNumber, percent, relativeTime, dateShort } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { RevenueChart, OrdersChart } from "@/components/dashboard/dashboard-charts";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Store performance at a glance — last 30 days."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/orders">View orders</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products/new">
                <PlusCircle className="h-4 w-4" /> New product
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue (30d)"
          value={moneyWhole(data.revenue30)}
          icon={DollarSign}
          delta={data.revenueDelta}
          hint="vs prior 30d"
        />
        <StatCard label="Today's revenue" value={money(data.todayRevenue)} icon={TrendingUp} />
        <StatCard
          label="Orders today"
          value={fmtNumber(data.ordersToday)}
          icon={ShoppingCart}
          delta={data.ordersTodayDelta}
          hint="vs yesterday"
        />
        <StatCard label="Customers" value={fmtNumber(data.customerCount)} icon={Users} />
        <StatCard label="Avg order value" value={money(data.avgOrderValue)} icon={Receipt} />
        <StatCard
          label="Refund rate"
          value={data.refundRate === null ? "—" : percent(data.refundRate)}
          icon={AlertTriangle}
          hint="30d"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue</CardTitle>
              <p className="text-sm text-muted-foreground">Realized revenue by day</p>
            </div>
            <Badge variant="muted">30 days</Badge>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <p className="text-sm text-muted-foreground">Order volume by day</p>
          </CardHeader>
          <CardContent>
            <OrdersChart data={data.series} />
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will appear here as customers check out." />
            ) : (
              <div className="divide-y divide-border">
                {data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{order.email}</p>
                      <p className="text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)} · {relativeTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="w-20 text-right text-sm font-medium tabular-nums">
                        {money(order.total_cents)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <p className="text-sm text-muted-foreground">By revenue, 30 days</p>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topProducts.length === 0 ? (
              <EmptyState icon={Package} title="No sales yet" />
            ) : (
              <ol className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtNumber(product.quantity)} sold</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{moneyWhole(product.revenue_cents)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low inventory */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Low inventory</CardTitle>
            {data.lowStockCount > 0 && <Badge variant="warning">{data.lowStockCount}</Badge>}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/inventory">
              Manage <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {data.lowStock.length === 0 ? (
            <EmptyState icon={Boxes} title="Inventory looks healthy" description="No active variants at or below the low-stock threshold." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.lowStock.map((variant) => (
                <div key={variant.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="truncate text-sm font-medium">{variant.product_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{variant.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={variant.inventory_quantity === 0 ? "destructive" : "warning"}>
                      {variant.inventory_quantity === 0 ? "Out of stock" : `${variant.inventory_quantity} left`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{money(variant.price_cents)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Data as of {dateShort(new Date())}. Revenue counts paid, processing, and fulfilled orders.
      </p>
    </div>
  );
}
