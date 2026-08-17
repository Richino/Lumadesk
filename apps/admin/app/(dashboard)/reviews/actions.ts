"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/activity";
import type { ReviewStatus } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();
  // Rejected reviews can't stay featured.
  const patch = status === "approved" ? { status } : { status, featured: false };
  const { error } = await supabase.from("reviews").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: `review.${status}`,
    entityType: "review",
    entityId: id,
    summary: `Review ${id.slice(0, 8)} ${status}`,
  });

  revalidatePath("/reviews");
  return { ok: true };
}

export async function toggleReviewFeatured(id: string, featured: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  // Only approved reviews may be featured.
  const { data: review } = await supabase.from("reviews").select("status").eq("id", id).maybeSingle();
  if (featured && review?.status !== "approved") {
    return { ok: false, error: "Approve the review before featuring it." };
  }

  const { error } = await supabase.from("reviews").update({ featured }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: featured ? "review.feature" : "review.unfeature",
    entityType: "review",
    entityId: id,
    summary: `Review ${id.slice(0, 8)} ${featured ? "featured" : "unfeatured"}`,
  });

  revalidatePath("/reviews");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: admin.id,
    action: "review.delete",
    entityType: "review",
    entityId: id,
    summary: `Deleted review ${id.slice(0, 8)}`,
  });

  revalidatePath("/reviews");
  return { ok: true };
}
