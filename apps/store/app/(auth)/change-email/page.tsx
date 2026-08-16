import Link from "next/link";
import { ChangeEmailForm } from "@/components/account/change-email-form";
import { requireUser } from "@/lib/auth/require-user";

export default async function ChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; verified?: string }>;
}) {
  const { confirmed, verified } = await searchParams;
  const profile = await requireUser();

  if (confirmed) {
    return (
      <section className="auth-card" aria-labelledby="change-email-title">
        <p className="eyebrow">EMAIL UPDATED</p>
        <h1 id="change-email-title">You&rsquo;re all set.</h1>
        <p className="auth-intro">
          Your new email address is confirmed and now signs you in to LumaDesk.
        </p>
        <Link className="auth-submit" href="/login">
          Return to login
        </Link>
      </section>
    );
  }

  if (!verified) {
    return (
      <section className="auth-card" aria-labelledby="change-email-title">
        <p className="eyebrow">EMAIL SECURITY</p>
        <h1 id="change-email-title">Confirm from your inbox first.</h1>
        <p className="auth-intro">
          Request a secure change link from Settings, then open that link from
          your current email address.
        </p>
        <Link className="auth-submit" href="/settings">
          Return to settings
        </Link>
      </section>
    );
  }

  return (
    <section className="auth-card" aria-labelledby="change-email-title">
      <p className="eyebrow">CURRENT EMAIL CONFIRMED</p>
      <h1 id="change-email-title">Choose your new email.</h1>
      <p className="auth-intro">
        Enter the new address for your LumaDesk account. We will verify it
        before completing the change.
      </p>
      <ChangeEmailForm currentEmail={profile.email} />
      <Link className="auth-shopping" href="/settings">
        Cancel and return to settings
      </Link>
    </section>
  );
}
