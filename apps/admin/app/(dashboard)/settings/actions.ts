"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import { settingsSchema } from "@/lib/validation/settings";

type Result = { ok: true } | { ok: false; error: string };

export async function updateStoreSettings(input: unknown): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .upsert({ id: true, ...parsed.data }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "settings.update",
    entityType: "store_settings",
    summary: "Updated store settings",
  });

  revalidatePath("/settings");
  return { ok: true };
}
