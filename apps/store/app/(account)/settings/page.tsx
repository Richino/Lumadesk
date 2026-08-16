import { ProfileSettings } from "@/components/account/profile-settings";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const profile = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUserIdentities();
  const hasPasswordIdentity = data?.identities.some((identity) => identity.provider === "email") ?? false;

  return <><p className="eyebrow">SETTINGS</p><h2 className="account-title">The details that make it yours.</h2><ProfileSettings profile={profile} hasPasswordIdentity={hasPasswordIdentity} /></>;
}
