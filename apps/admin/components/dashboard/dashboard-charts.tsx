"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/queries/dashboard";
import { moneyWhole, number as fmtNumber } from "@/lib/format";

const axisProps = {
  stroke: "hsl(240 5% 45%)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatter: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-0.5 font-medium text-foreground">{label}</p>
      <p className="tabular-nums text-muted-foreground">{formatter(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(244 75% 63%)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(244 75% 63%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 16%)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={28} />
        <YAxis
          {...axisProps}
          width={54}
          tickFormatter={(v: number) => moneyWhole(v * 100)}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => moneyWhole(v * 100)} />} cursor={{ stroke: "hsl(240 5% 30%)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(244 75% 66%)"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 16%)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={28} />
        <YAxis {...axisProps} width={32} allowDecimals={false} />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `${fmtNumber(v)} orders`} />}
          cursor={{ fill: "hsl(240 5% 14%)" }}
        />
        <Bar dataKey="orders" fill="hsl(190 70% 55%)" radius={[3, 3, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
