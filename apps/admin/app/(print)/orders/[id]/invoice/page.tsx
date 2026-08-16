import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderDetail } from "@/lib/queries/orders";
import { PrintableOrder } from "@/components/print/printable-order";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice #${id.slice(0, 8)}` };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  return <PrintableOrder order={detail.order} items={detail.items} variant="invoice" />;
}
