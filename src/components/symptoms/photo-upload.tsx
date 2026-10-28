"use client";

import { Camera, RefreshCw, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { savePhoto, useUploadedPhoto } from "@/lib/client/storage";
import { cn } from "@/lib/cn";

const MAX_EDGE = 1280;

/** Shrinks a photo in the browser so it can be kept for this visit without uploading it anywhere. */
async function toDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Optional photo of the person's own print, shown next to the example images
 * so they can compare. It stays in this browser tab: it is not uploaded, stored
 * on a server or analysed, and the page says so.
 */
export function PhotoUpload({ compact = false, className }: { compact?: boolean; className?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const photo = useUploadedPhoto();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Choose a photo (JPEG, PNG or similar).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await toDataUrl(file);
      if (!savePhoto({ dataUrl, name: file.name, at: Date.now() })) setError("This browser could not keep the photo. You can carry on without it.");
    } catch {
      setError("That photo could not be opened. Try another file, or carry on without one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const picker = (
    <input
      ref={input}
      id={`${id}-file`}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-label="Photo of your print"
      onChange={(e) => onFile(e.target.files?.[0])}
      aria-describedby={`${id}-note`}
    />
  );

  return (
    <section aria-labelledby={`${id}-h`} className={cn("rounded-lg border border-line bg-surface p-4", className)}>
      <h2 id={`${id}-h`} className="font-semibold">
        <Camera className="mr-2 inline size-4 align-[-2px] text-primary-dark" aria-hidden />
        {photo ? "Your photo" : "Upload a photo of your print"} <span className="text-sm font-normal whitespace-nowrap text-ink/70">(optional)</span>
      </h2>
      <p id={`${id}-note`} className="mt-1 text-sm text-ink/70">
        Keep it beside the example pictures to compare. It stays in this browser tab: it is not uploaded, and FixMyPrint does not analyse photos, so the
        diagnosis comes only from your answers.
      </p>
      {picker}
      {photo ? (
        <div className={cn("mt-3 flex gap-3", compact ? "flex-col" : "flex-col sm:flex-row sm:items-start")}>
          {/* A local data URL the person chose; nothing to optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt="Your photo of the print" className={cn("rounded-md border border-line object-cover", compact ? "aspect-[4/3] w-full" : "aspect-[4/3] w-full sm:w-56")} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
              <RefreshCw aria-hidden />
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={() => savePhoto(null)}>
              <Trash2 aria-hidden />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
            <Camera aria-hidden />
            {busy ? "Preparing photo…" : "Choose a photo"}
          </Button>
        </div>
      )}
      {error && (
        <Notice tone="caution" className="mt-3">
          {error}
        </Notice>
      )}
    </section>
  );
}
