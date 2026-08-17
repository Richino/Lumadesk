import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { getAnalytics } from "@/lib/queries/analytics";

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const rangeParam = Number(request.nextUrl.searchParams.get("range"));
  const rangeDays = [30, 90, 180, 365].includes(rangeParam) ? rangeParam : 90;

  const data = await getAnalytics(rangeDays);

  const header = ["date", "revenue_usd", "orders"];
  const lines = [header.join(",")];
  for (const point of data.daily) {
    lines.push([point.key, point.revenue.toFixed(2), point.orders].map(csvEscape).join(","));
  }
  const csv = lines.join("\n");

  const filename = `lumadesk-sales-${data.rangeDays}d-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
