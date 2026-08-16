import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: "customer" | "admin";
};

/**
 * Server-side gate for every admin surface. Redirects unauthenticated users to
 * the login page and non-admins to /unauthorized. Returns the admin profile so
 * layouts/pages can render the user menu without a second round-trip.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  const uid = claims?.claims?.sub;
  if (!uid) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, avatar_url, role")
    .eq("id", uid)
    .single();

  if (!profile) redirect("/login?message=profile_missing");
  if (profile.role !== "admin") redirect("/unauthorized");

  return profile as AdminProfile;
}

/** Non-redirecting variant for route handlers / server actions. */
export async function getAdmin(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, avatar_url, role")
    .eq("id", uid)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return profile as AdminProfile;
}
