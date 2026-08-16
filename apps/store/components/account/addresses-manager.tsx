"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Address = { id: string; full_name: string; line1: string; line2: string | null; city: string; state: string; postal_code: string; is_default: boolean };

export function AddressesManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  const addAddress = async (data: FormData) => {
    setBusy(true); setNotice(null);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setNotice("Please sign in again."); setBusy(false); return; }
    const record = { user_id: user.user.id, full_name: String(data.get("full_name")), line1: String(data.get("line1")), line2: String(data.get("line2")) || null, city: String(data.get("city")), state: String(data.get("state")).toUpperCase(), postal_code: String(data.get("postal_code")), is_default: addresses.length === 0 };
    const { data: created, error } = await supabase.from("addresses").insert(record).select("id, full_name, line1, line2, city, state, postal_code, is_default").single();
    if (error || !created) setNotice(error?.message ?? "Unable to save address."); else { setAddresses((current) => [...current, created]); setNotice("Address saved."); }
    setBusy(false);
  };
  const removeAddress = async (id: string) => { const { error } = await supabase.from("addresses").delete().eq("id", id); if (error) setNotice(error.message); else setAddresses((current) => current.filter((address) => address.id !== id)); };
  return <div className="settings-stack">{notice && <p className="auth-notice" role="status">{notice}</p>}{addresses.map((address) => <section className="settings-card" key={address.id}><h2>{address.full_name}{address.is_default ? " · Default" : ""}</h2><p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}, {address.state} {address.postal_code}</p><button className="text-btn" type="button" onClick={() => removeAddress(address.id)}>Remove address</button></section>)}<form className="settings-card" action={addAddress}><h2>Add an address</h2><label>Full name<input name="full_name" required maxLength={120} /></label><label>Address line 1<input name="line1" required maxLength={120} /></label><label>Address line 2<input name="line2" maxLength={120} /></label><div className="auth-grid"><label>City<input name="city" required maxLength={80} /></label><label>State<input name="state" required minLength={2} maxLength={80} /></label></div><label>ZIP code<input name="postal_code" required minLength={3} maxLength={16} /></label><button className="auth-submit" disabled={busy}>{busy ? "Saving…" : "Save address"}</button></form></div>;
}
