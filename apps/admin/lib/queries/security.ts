import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SecurityOverview = {
  email: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
  mfaEnabled: boolean;
  mfaFactorCount: number;
  provider: string | null;
};

export async function getSecurityOverview(): Promise<SecurityOverview> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const factors = (user?.factors ?? []).filter((f) => f.status === "verified");

  return {
    email: user?.email ?? null,
    lastSignInAt: user?.last_sign_in_at ?? null,
    createdAt: user?.created_at ?? null,
    mfaEnabled: factors.length > 0,
    mfaFactorCount: factors.length,
    provider: (user?.app_metadata?.provider as string | undefined) ?? null,
  };
}
