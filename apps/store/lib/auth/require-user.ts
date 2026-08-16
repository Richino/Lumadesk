import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: "customer" | "admin";
  marketing_emails: boolean;
  order_updates: boolean;
  has_password: boolean;
};

export async function requireUser(): Promise<Profile> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, avatar_url, role, marketing_emails, order_updates, has_password")
    .eq("id", claims.claims.sub)
    .single();

  if (!profile) redirect("/login?message=profile_missing");
  return profile as Profile;
}
