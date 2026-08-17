import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MediaLibrary } from "@/components/media/media-library";

export const metadata: Metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" description="Upload and organize imagery in the media storage bucket." />
      <MediaLibrary />
    </div>
  );
}
