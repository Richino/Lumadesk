import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const input = z.object({ email: z.string().trim().email().max(320) });
export async function POST(request: Request) {
  const body = input.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  try { const { error } = await createServiceRoleClient().from("newsletter_subscribers").upsert({ email: body.data.email.toLowerCase(), unsubscribed_at: null }, { onConflict: "email" }); if (error) throw error; return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 503 }); }
}
