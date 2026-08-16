import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <ComingSoon
      title="Media Library"
      description="Upload, search, and organize product imagery into folders and galleries, backed by Supabase Storage. Coming in a later phase."
    />
  );
}
