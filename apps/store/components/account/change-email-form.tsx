"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangeEmailForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const supabase = createClient();

  const updateEmail = async (formData: FormData) => {
    setBusy(true);
    setNotice(null);
    const email = String(formData.get("new_email")).trim().toLowerCase();

    if (email === currentEmail.toLowerCase()) {
      setNotice("Enter a different email address.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/change-email?confirmed=1")}`,
      },
    );

    setNotice(
      error
        ? error.message
        : `Verification sent to ${email}. Open that link to finish updating your email.`,
    );
    setBusy(false);
  };

  return (
    <form action={updateEmail} className="auth-form">
      <div className="current-email" aria-label="Current LumaDesk email">
        <span>Current LumaDesk email</span>
        <strong>{currentEmail}</strong>
      </div>
      <label className="auth-field">
        New email address
        <input
          name="new_email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy}
          required
        />
      </label>
      <button className="auth-submit" disabled={busy}>
        {busy ? "Sending…" : "Send verification to new email"}
      </button>
      {notice && (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      )}
    </form>
  );
}
