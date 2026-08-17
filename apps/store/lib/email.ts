import { Resend } from "resend";

export async function sendOrderConfirmation({ to, confirmationNumber, totalCents }: { to: string; confirmationNumber: string; totalCents: number }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.NEXT_PUBLIC_APP_URL) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const orderLookupUrl = new URL("/order-lookup", process.env.NEXT_PUBLIC_APP_URL);
  orderLookupUrl.searchParams.set("confirmation", confirmationNumber);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Order ${confirmationNumber} is confirmed`,
    html: `<div style="font-family:Arial,sans-serif;color:#161616;line-height:1.6"><p style="font-size:11px;letter-spacing:.12em">LUMADESK · ORDER CONFIRMED</p><h1 style="font-size:30px;line-height:1.1">Your desk is in motion.</h1><p>Thank you for choosing LumaDesk. Your payment of $${(totalCents / 100).toFixed(2)} has been confirmed.</p><p><strong>Confirmation number: ${confirmationNumber}</strong></p><p>Use your email address and confirmation number to look up this order at any time.</p><p><a href="${orderLookupUrl.toString()}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;text-decoration:none">View your order</a></p></div>`,
  }, { headers: { "Idempotency-Key": `order-confirmation-${confirmationNumber}` } });
  if (error) throw new Error(`Order confirmation email failed: ${error.message}`);
}
