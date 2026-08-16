import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  try {
    // `orders.user_id` is ON DELETE SET NULL, preserving order history when an account is removed.
    const { error } = await createServiceRoleClient().auth.admin.deleteUser(userId, true);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete account.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
