import Link from "next/link";

export default async function ChangeEmailPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  const { confirmed } = await searchParams;
  return <section className="auth-card" aria-labelledby="change-email-title"><p className="eyebrow">EMAIL CONFIRMATION</p><h1 id="change-email-title">Your email is being updated.</h1><p className="auth-intro">{confirmed ? "Your confirmation was received. If Supabase requires both confirmations, complete the remaining link in your inbox." : "Open the confirmation links from your current and new inboxes to securely complete this change."}</p><Link className="auth-submit" href="/settings">Return to settings</Link><Link className="auth-shopping" href="/">Continue shopping</Link></section>;
}
