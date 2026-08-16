"use client";

import { useRef, useState } from "react";
import type { Profile } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [portraitName, setPortraitName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const saveProfile = async (formData: FormData) => {
    setBusy(true); setNotice(null);
    const { error } = await supabase.from("users").update({ first_name: formData.get("first_name"), last_name: formData.get("last_name"), marketing_emails: formData.get("marketing_emails") === "on", order_updates: formData.get("order_updates") === "on" }).eq("id", profile.id);
    setNotice(error ? error.message : "Your preferences have been saved."); setBusy(false);
  };
  const updateEmail = async (formData: FormData) => {
    setBusy(true); setEmailNotice(null);
    const email = String(formData.get("email")).trim();
    if (email === profile.email) { setEmailNotice("Enter a different email address to request a confirmation link."); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/change-email?confirmed=1")}` });
    setEmailNotice(error ? error.message : "Confirmation links have been sent to your current and new email addresses."); setBusy(false);
  };
  const requestPasswordReset = async () => {
    setBusy(true); setPasswordNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}` });
    setPasswordNotice(error ? error.message : "A secure password-reset link has been sent to your email."); setBusy(false);
  };
  const uploadAvatar = async (file: File) => { setBusy(true); const path = `${profile.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`; const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: false }); if (error) setNotice(error.message); else { const { data } = supabase.storage.from("avatars").getPublicUrl(path); const update = await supabase.from("users").update({ avatar_url: data.publicUrl }).eq("id", profile.id); setNotice(update.error?.message ?? "Your portrait has been updated."); } setBusy(false); };
  const deleteAccount = async () => {
    if (!window.confirm("Delete your LumaDesk account? This permanently removes your profile and sign-in access.")) return;
    setBusy(true); setNotice(null);
    const response = await fetch("/api/account/delete", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(body.error ?? "Unable to delete your account."); setBusy(false); return; }
    window.location.assign("/");
  };
  return <div className="settings-stack">{notice && <p className="auth-notice" role="status">{notice}</p>}<form action={saveProfile} className="settings-card"><h2>Profile</h2><label>First name<input name="first_name" defaultValue={profile.first_name} required /></label><label>Last name<input name="last_name" defaultValue={profile.last_name} required /></label><label className="auth-check"><input name="marketing_emails" type="checkbox" defaultChecked={profile.marketing_emails} /> Product notes and studio news</label><label className="auth-check"><input name="order_updates" type="checkbox" defaultChecked={profile.order_updates} /> Order and delivery updates</label><button className="auth-submit" disabled={busy}>Save profile</button></form><section className="settings-card"><h2>Portrait</h2><p>Use a square JPG, PNG, or WebP under 5 MB.</p><div className="portrait-control"><input ref={fileRef} id="portrait-upload" className="portrait-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; setPortraitName(file?.name ?? ""); if (file) uploadAvatar(file); }} /><label className="portrait-upload" htmlFor="portrait-upload">{busy ? "Uploading…" : "Choose portrait"}</label><span className="portrait-file-name">{portraitName || "No file selected"}</span></div></section><form action={updateEmail} className="settings-card"><h2>Email</h2><p>We will send confirmation links before changing your sign-in email.</p><label>Email address<input name="email" type="email" defaultValue={profile.email} required /></label><button className="auth-submit" disabled={busy}>Send confirmation link</button>{emailNotice && <p className="action-notice" role="status">{emailNotice}</p>}</form><section className="settings-card"><h2>Password</h2><p>We will email a secure link so you can choose a new password.</p><button type="button" className="auth-submit" onClick={requestPasswordReset} disabled={busy}>Send reset link</button>{passwordNotice && <p className="action-notice" role="status">{passwordNotice}</p>}</section><section className="settings-card danger-card"><h2>Delete account</h2><p>This permanently removes your LumaDesk profile and sign-in access. Your order records remain safely retained.</p><button type="button" className="danger-button" onClick={deleteAccount} disabled={busy}>Delete my account</button></section></div>;
}
