"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Folder,
  FileIcon,
  Trash2,
  Search,
  X,
  Loader2,
  ChevronRight,
  Home,
  Copy,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const BUCKET = "media";

type Entry = {
  name: string;
  isFolder: boolean;
  size: number | null;
  mimetype: string | null;
  path: string;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const supabase = createClient();
  const [prefix, setPrefix] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (currentPrefix: string) => {
      setLoading(true);
      const { data, error } = await supabase.storage.from(BUCKET).list(currentPrefix || undefined, {
        limit: 200,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        toast.error(error.message);
        setEntries([]);
        setLoading(false);
        return;
      }
      const mapped: Entry[] = (data ?? [])
        // The bucket's own placeholder rows (id null + no metadata) that aren't real folders are filtered by name.
        .filter((item) => item.name !== ".emptyFolderPlaceholder")
        .map((item) => {
          const isFolder = item.id === null;
          const path = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
          return {
            name: item.name,
            isFolder,
            size: (item.metadata?.size as number | undefined) ?? null,
            mimetype: (item.metadata?.mimetype as string | undefined) ?? null,
            path,
          };
        });
      setEntries(mapped);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    load(prefix);
  }, [prefix, load]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const path = prefix ? `${prefix}/${file.name}` : file.name;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
      } else {
        ok += 1;
      }
    }
    if (ok > 0) toast.success(`Uploaded ${ok} file${ok === 1 ? "" : "s"}.`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load(prefix);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.storage.from(BUCKET).remove([deleting.path]);
    if (error) toast.error(error.message);
    else toast.success("File deleted.");
    setDeleting(null);
    load(prefix);
  }

  function copyUrl(entry: Entry) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(entry.path);
    navigator.clipboard.writeText(data.publicUrl).then(
      () => toast.success("Public URL copied."),
      () => toast.error("Couldn't copy URL.")
    );
  }

  const crumbs = prefix ? prefix.split("/") : [];
  const filtered = entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const folders = filtered.filter((e) => e.isFolder);
  const files = filtered.filter((e) => !e.isFolder);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter this folder…" className="pl-9" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button onClick={() => setPrefix("")} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <Home className="h-3.5 w-3.5" /> media
        </button>
        {crumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <button
              onClick={() => setPrefix(crumbs.slice(0, index + 1).join("/"))}
              className={cn(index === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {crumb}
            </button>
          </span>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="This folder is empty"
          description="Upload images to build product galleries and marketing assets."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {folders.map((folder) => (
            <button
              key={folder.path}
              onClick={() => setPrefix(folder.path)}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/40"
            >
              <Folder className="h-8 w-8 text-muted-foreground" />
              <span className="w-full truncate text-xs font-medium">{folder.name}</span>
            </button>
          ))}
          {files.map((file) => {
            const isImage = file.mimetype?.startsWith("image/");
            const url = supabase.storage.from(BUCKET).getPublicUrl(file.path).data.publicUrl;
            return (
              <div key={file.path} className="group relative overflow-hidden rounded-lg border border-border bg-muted/20">
                <div className="flex aspect-square items-center justify-center bg-black/20">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => copyUrl(file)}
                    className="rounded-md bg-background/90 p-1.5 text-muted-foreground shadow hover:text-foreground"
                    aria-label="Copy URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(file)}
                    className="rounded-md bg-background/90 p-1.5 text-rose-400 shadow hover:text-rose-300"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete file?"
        description={`This permanently removes “${deleting?.name}” from storage. Anything referencing its URL will break.`}
        confirmLabel="Delete file"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
