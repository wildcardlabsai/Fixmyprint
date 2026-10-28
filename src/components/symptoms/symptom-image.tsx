"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { VisualAsset } from "@/lib/schema";

interface Props {
  /** The image to show, or null when none is available yet. */
  asset: VisualAsset | null;
  className?: string;
  /** Show who made the image and under what licence. */
  credit?: boolean;
  /** Load straight away instead of when scrolled into view. */
  eager?: boolean;
}

/**
 * A symptom photograph or illustration at a fixed 4:3 ratio. While loading it
 * shows a neutral placeholder; if there is no image, or it fails to load, it
 * says so instead of leaving a gap or showing something unrelated.
 */
export function SymptomImage({ asset, className, credit = false, eager = false }: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const img = useRef<HTMLImageElement>(null);
  const failed = !asset?.file || state === "failed";

  // A server-rendered image can finish loading before hydration, so onLoad never fires.
  useEffect(() => {
    const el = img.current;
    setState(el?.complete ? (el.naturalWidth > 0 ? "loaded" : "failed") : "loading");
  }, [asset?.file]);

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-page">
        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center text-xs text-ink/70">
            <ImageOff className="size-5" aria-hidden />
            <span>{asset ? "Image could not be loaded" : "No image yet"}</span>
          </div>
        ) : (
          <>
            {state === "loading" && <div className="absolute inset-0 animate-pulse bg-line/60" aria-hidden />}
            {/* Small, pre-sized SVG and photo files; next/image would add nothing for SVG. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={img}
              src={asset.file!}
              alt={asset.alt}
              width={asset.width ?? undefined}
              height={asset.height ?? undefined}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => setState("loaded")}
              onError={() => setState("failed")}
              className={cn("h-full w-full object-cover transition-opacity", state === "loaded" ? "opacity-100" : "opacity-0")}
            />
          </>
        )}
      </div>
      {credit && asset && !failed && <figcaption className="mt-1 text-xs text-ink/70">{creditText(asset)}</figcaption>}
    </figure>
  );
}

export function creditText(a: VisualAsset): string {
  if (a.kind === "illustration") return "Illustration";
  return a.attribution ?? [a.creator, a.licence].filter(Boolean).join(", ");
}
