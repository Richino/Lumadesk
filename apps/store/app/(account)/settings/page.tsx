import { ProfileSettings } from "@/components/account/profile-settings";
import { requireUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  const profile = await requireUser();

  return <><p className="eyebrow">SETTINGS</p><h2 className="account-title">The details that make it yours.</h2><ProfileSettings profile={profile} hasPassword={profile.has_password} /></>;
}
