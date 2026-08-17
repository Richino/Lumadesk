import Link from "next/link";
import type { Metadata } from "next";
import { DollarSign, ShoppingCart, Receipt, RotateCcw } from "lucide-react";
import { getAnalytics } from "@/lib/queries/analytics";
import { money, moneyWhole, number as fmtNumber, percent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import {
  DailyRevenueChart,
  MonthlyRevenueChart,
  MonthlyOrdersChart,
} from "@/components/analytics/analytics-charts";
import { ExportButton } from "@/components/analytics/export-button";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const RANGES = [30, 90, 180, 365];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rangeParam = Number(one(sp.range));
  const rangeDays = RANGES.includes(rangeParam) ? rangeParam : 90;

  const data = await getAnalytics(rangeDays);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Revenue, orders, and product performance — last ${rangeDays} days.`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/analytics?range=${r}`}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                    rangeDays === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}d
                </Link>
              ))}
            </div>
            <ExportButton rangeDays={rangeDays} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={moneyWhole(data.revenue)} icon={DollarSign} />
        <StatCard label="Orders" value={fmtNumber(data.orders)} icon={ShoppingCart} />
        <StatCard label="Avg order value" value={money(data.avgOrderValue)} icon={Receipt} />
        <StatCard
          label="Refund rate"
          value={data.refundRate === null ? "—" : percent(data.refundRate)}
          icon={RotateCcw}
          hint={data.refundedAmount > 0 ? moneyWhole(data.refundedAmount) : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
          <p className="text-sm text-muted-foreground">Realized revenue by day</p>
        </CardHeader>
        <CardContent>
          <DailyRevenueChart data={data.daily} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly performance</CardTitle>
          <p className="text-sm text-muted-foreground">Last 12 months</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="revenue">
              <MonthlyRevenueChart data={data.monthly} />
            </TabsContent>
            <TabsContent value="orders">
              <MonthlyOrdersChart data={data.monthly} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
          <p className="text-sm text-muted-foreground">By revenue, last {rangeDays} days</p>
        </CardHeader>
        <CardContent className="pt-0">
          {data.topProducts.length === 0 ? (
            <EmptyState icon={Package} title="No sales in this period" className="border-0" />
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => {
                const max = data.topProducts[0].revenue_cents || 1;
                const width = Math.max(4, Math.round((product.revenue_cents / max) * 100));
                return (
                  <div key={product.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                        <span className="font-medium">{product.name}</span>
                      </span>
                      <span className="tabular-nums">
                        {moneyWhole(product.revenue_cents)}{" "}
                        <span className="text-muted-foreground">· {fmtNumber(product.quantity)} sold</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
