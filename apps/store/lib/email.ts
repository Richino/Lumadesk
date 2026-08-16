import { Resend } from "resend";

export async function sendOrderConfirmation({ to, orderId, totalCents }: { to: string; orderId: string; totalCents: number }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your LumaDesk order ${orderId.slice(0, 8)} is confirmed`,
    html: `<p>Thank you for choosing LumaDesk.</p><p>Your payment of $${(totalCents / 100).toFixed(2)} has been confirmed. We will share delivery details as your desk moves into production.</p>`,
  }, { headers: { "Idempotency-Key": `order-confirmation-${orderId}` } });
  if (error) throw new Error(`Order confirmation email failed: ${error.message}`);
}
