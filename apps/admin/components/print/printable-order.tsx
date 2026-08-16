import type { Order, OrderItem } from "@/lib/types";
import { money, dateShort } from "@/lib/format";
import { PrintButton } from "@/components/print/print-button";

export function PrintableOrder({
  order,
  items,
  variant,
}: {
  order: Order;
  items: OrderItem[];
  variant: "invoice" | "packing-slip";
}) {
  const isInvoice = variant === "invoice";
  const address = order.shipping_address;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-sm font-bold text-white">
              L
            </div>
            <span className="text-lg font-bold tracking-tight">LumaDesk</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Made-to-order standing desks</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold uppercase tracking-wide">
            {isInvoice ? "Invoice" : "Packing Slip"}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-600">#{order.id.slice(0, 8)}</p>
          <p className="text-xs text-zinc-500">{dateShort(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Bill to</p>
          <p className="font-medium">{address?.full_name ?? order.email}</p>
          <p className="text-zinc-600">{order.email}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Ship to</p>
          {address ? (
            <address className="not-italic leading-relaxed text-zinc-600">
              <span className="block font-medium text-zinc-900">{address.full_name}</span>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.postal_code}
              <br />
              {address.country_code}
            </address>
          ) : (
            <p className="text-zinc-500">—</p>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-900 text-left">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-center font-semibold">Qty</th>
            {isInvoice && <th className="py-2 text-right font-semibold">Unit</th>}
            {isInvoice && <th className="py-2 text-right font-semibold">Amount</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-zinc-200">
              <td className="py-2.5">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-zinc-500">{item.variant_name}</p>
              </td>
              <td className="py-2.5 text-center tabular-nums">{item.quantity}</td>
              {isInvoice && <td className="py-2.5 text-right tabular-nums">{money(item.unit_price_cents)}</td>}
              {isInvoice && (
                <td className="py-2.5 text-right tabular-nums">{money(item.unit_price_cents * item.quantity)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isInvoice && (
        <div className="flex justify-end">
          <dl className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="tabular-nums">{money(order.subtotal_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Shipping</dt>
              <dd className="tabular-nums">{money(order.shipping_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Tax</dt>
              <dd className="tabular-nums">{money(order.tax_cents)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-900 pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(order.total_cents)}</dd>
            </div>
          </dl>
        </div>
      )}

      {order.tracking_number && (
        <p className="text-sm text-zinc-600">
          <span className="font-medium">Tracking:</span> {order.carrier ? `${order.carrier} · ` : ""}
          {order.tracking_number}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <p className="text-xs text-zinc-400">
          Thank you for choosing LumaDesk. Questions? support@lumadesk.com
        </p>
        <PrintButton label={isInvoice ? "Print invoice" : "Print packing slip"} />
      </div>
    </div>
  );
}
