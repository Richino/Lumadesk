"use client";

import { useRef, useState } from "react";
import type { Profile } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const saveProfile = async (formData: FormData) => {
    setBusy(true); setNotice(null);
    const { error } = await supabase.from("users").update({ first_name: formData.get("first_name"), last_name: formData.get("last_name"), marketing_emails: formData.get("marketing_emails") === "on", order_updates: formData.get("order_updates") === "on" }).eq("id", profile.id);
    setNotice(error ? error.message : "Your preferences have been saved."); setBusy(false);
  };
  const updateEmail = async (formData: FormData) => { const { error } = await supabase.auth.updateUser({ email: String(formData.get("email")) }); setNotice(error ? error.message : "Check both addresses to confirm your new email."); };
  const updatePassword = async (formData: FormData) => { const { error } = await supabase.auth.updateUser({ password: String(formData.get("password")) }); setNotice(error ? error.message : "Your password has been updated."); };
  const uploadAvatar = async (file: File) => { setBusy(true); const path = `${profile.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`; const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: false }); if (error) setNotice(error.message); else { const { data } = supabase.storage.from("avatars").getPublicUrl(path); const update = await supabase.from("users").update({ avatar_url: data.publicUrl }).eq("id", profile.id); setNotice(update.error?.message ?? "Your portrait has been updated."); } setBusy(false); };
  const deleteAccount = async () => {
    if (!window.confirm("Delete your LumaDesk account? This permanently removes your profile and sign-in access.")) return;
    setBusy(true); setNotice(null);
    const response = await fetch("/api/account/delete", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(body.error ?? "Unable to delete your account."); setBusy(false); return; }
    window.location.assign("/");
  };
  return <div className="settings-stack">{notice && <p className="auth-notice" role="status">{notice}</p>}<form action={saveProfile} className="settings-card"><h2>Profile</h2><label>First name<input name="first_name" defaultValue={profile.first_name} required /></label><label>Last name<input name="last_name" defaultValue={profile.last_name} required /></label><label className="auth-check"><input name="marketing_emails" type="checkbox" defaultChecked={profile.marketing_emails} /> Product notes and studio news</label><label className="auth-check"><input name="order_updates" type="checkbox" defaultChecked={profile.order_updates} /> Order and delivery updates</label><button className="auth-submit" disabled={busy}>Save profile</button></form><section className="settings-card"><h2>Portrait</h2><p>Use a square JPG, PNG, or WebP under 5 MB.</p><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); }} /></section><form action={updateEmail} className="settings-card"><h2>Email</h2><label>Email address<input name="email" type="email" defaultValue={profile.email} required /></label><button className="auth-submit">Update email</button></form><form action={updatePassword} className="settings-card"><h2>Security</h2><label>New password<input name="password" type="password" minLength={12} required /></label><button className="auth-submit">Update password</button></form><section className="settings-card danger-card"><h2>Delete account</h2><p>This permanently removes your LumaDesk profile and sign-in access. This cannot be undone.</p><button type="button" className="danger-button" onClick={deleteAccount} disabled={busy}>Delete my account</button></section></div>;
}
