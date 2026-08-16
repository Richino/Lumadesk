import { AddressesManager } from "@/components/account/addresses-manager";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
export default async function AddressesPage() { const user = await requireUser(); const supabase = await createClient(); const { data } = await supabase.from("addresses").select("id, full_name, line1, line2, city, state, postal_code, is_default").eq("user_id", user.id).order("created_at"); return <><p className="eyebrow">DELIVERY DETAILS</p><h2 className="account-title">Where your desk will arrive.</h2><AddressesManager initialAddresses={data ?? []} /></>; }
