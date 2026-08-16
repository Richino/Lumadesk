"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { Profile } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettings({
  profile,
  hasPassword,
}: {
  profile: Profile;
  hasPassword: boolean;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [passwordEnabled, setPasswordEnabled] = useState(hasPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState(
    [profile.first_name, profile.last_name].filter(Boolean).join(" "),
  );
  const router = useRouter();
  const supabase = createClient();
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const nextName = fullName.trim().replace(/\s+/g, " ");
    const space = nextName.indexOf(" ");
    const first_name = space === -1 ? nextName : nextName.slice(0, space);
    const last_name = space === -1 ? "" : nextName.slice(space + 1);
    const { error } = await supabase
      .from("users")
      .update({ first_name, last_name })
      .eq("id", profile.id);
    if (!error) setFullName(nextName);
    setNotice(error ? error.message : "Your profile has been saved.");
    setBusy(false);
  };
  const requestEmailChange = async () => {
    setBusy(true);
    setEmailNotice(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: profile.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/change-email?verified=1")}`,
      },
    });
    setEmailNotice(
      error
        ? error.message
        : `A secure change link was sent to ${profile.email}. Open it to continue.`,
    );
    setBusy(false);
  };
  const updatePassword = async (formData: FormData) => {
    setBusy(true);
    setPasswordNotice(null);
    const wasEnabled = passwordEnabled;
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("password_confirmation"));
    if (password.length < 12) {
      setPasswordNotice("Use at least 12 characters.");
      setBusy(false);
      return;
    }
    if (password !== confirmation) {
      setPasswordNotice("Passwords do not match.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPasswordNotice(error.message);
      setBusy(false);
      return;
    }
    if (wasEnabled) {
      // Changing an existing password signs out every session; the user
      // re-authenticates everywhere with the new password.
      await supabase.auth.signOut({ scope: "global" });
      window.location.assign("/login?message=password_updated");
      return;
    }
    setPasswordEnabled(true);
    setPasswordNotice(
      "Password added. You can now sign in with Google or with your email and password.",
    );
    setBusy(false);
  };
  const requestPasswordReset = async () => {
    setBusy(true);
    setPasswordNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setPasswordNotice(
      error
        ? error.message
        : "A secure password-reset link has been sent to your email.",
    );
    setBusy(false);
  };
  const uploadAvatar = async (file: File) => {
    setBusy(true);
    const path = `${profile.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false });
    if (error) setNotice(error.message);
    else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const update = await supabase
        .from("users")
        .update({ avatar_url: data.publicUrl })
        .eq("id", profile.id);
      setNotice(update.error?.message ?? "Your portrait has been updated.");
      if (!update.error) router.refresh();
    }
    setBusy(false);
  };
  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Delete your LumaDesk account? This permanently removes your profile and sign-in access.",
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    const response = await fetch("/api/account/delete", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(body.error ?? "Unable to delete your account.");
      setBusy(false);
      return;
    }
    window.location.assign("/");
  };
  return (
    <div className="settings-stack">
      {notice && (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      )}
      <form onSubmit={saveProfile} className="settings-card">
        <h2>Profile</h2>
        <label>
          Full name
          <input
            name="full_name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>
        <button className="auth-submit" disabled={busy}>
          Save profile
        </button>
      </form>
      <section className="settings-card">
        <h2>Portrait</h2>
        <p>Use a square JPG, PNG, or WebP under 5 MB.</p>
        <div className="portrait-control">
          <input
            id="portrait-upload"
            className="portrait-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadAvatar(file);
            }}
          />
          <label className="portrait-upload" htmlFor="portrait-upload">
            {busy ? "Uploading…" : "Choose portrait"}
          </label>
        </div>
      </section>
      <section className="settings-card">
        <h2>Email</h2>
        <p>
          First confirm this request from your current inbox. The secure link
          will open a dedicated page where you can enter your new email.
        </p>
        <div className="current-email" aria-label="Current email address">
          <span>Current email</span>
          <strong>{profile.email}</strong>
        </div>
        <button
          type="button"
          className="auth-submit"
          onClick={requestEmailChange}
          disabled={busy}
        >
          {busy ? "Sending…" : "Email me a change link"}
        </button>
        {emailNotice && (
          <p className="action-notice" role="status">
            {emailNotice}
          </p>
        )}
      </section>
      {passwordEnabled ? (
        <section className="settings-card">
          <h2>Password</h2>
          <p>We will email a secure link so you can choose a new password.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={requestPasswordReset}
            disabled={busy}
          >
            Send reset link
          </button>
          {passwordNotice && (
            <p className="action-notice" role="status">
              {passwordNotice}
            </p>
          )}
        </section>
      ) : (
        <form action={updatePassword} className="settings-card">
          <h2>Add a password</h2>
          <p>
            Add email-and-password sign-in while keeping your Google account
            connected.
          </p>
          <label>
            New password
            <span className="password-input">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={12}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-visibility"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Hide new password" : "Show new password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
          <label>
            Confirm password
            <span className="password-input">
              <input
                name="password_confirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                minLength={12}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-visibility"
                onClick={() =>
                  setShowPasswordConfirmation((visible) => !visible)
                }
                aria-label={
                  showPasswordConfirmation
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
                aria-pressed={showPasswordConfirmation}
              >
                {showPasswordConfirmation ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
          <button className="auth-submit" disabled={busy}>
            Add password
          </button>
          {passwordNotice && (
            <p className="action-notice" role="status">
              {passwordNotice}
            </p>
          )}
        </form>
      )}
      <section className="settings-card danger-card">
        <h2>Delete account</h2>
        <p>
          This permanently removes your LumaDesk profile and sign-in access.
          Your order records remain safely retained.
        </p>
        <button
          type="button"
          className="danger-button"
          onClick={deleteAccount}
          disabled={busy}
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}
