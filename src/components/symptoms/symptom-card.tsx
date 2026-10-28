"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { VisualAsset } from "@/lib/schema";
import { SymptomImage } from "./symptom-image";

interface Props {
  name: string;
  value: string;
  title: string;
  description: string;
  checked: boolean;
  onSelect: (value: string) => void;
  /** The symptom's image; null shows the "no image yet" fallback. */
  asset?: VisualAsset | null;
  /** Artwork for cards that are not a defect, such as "I'm not sure". Shown instead of an image. */
  art?: ReactNode;
}

/**
 * A selectable picture card. It is a native radio button inside a label, so it
 * works with the keyboard (arrow keys within the group) and screen readers
 * announce it as a choice with its title and description.
 */
export function SymptomCard({ name, value, title, description, checked, onSelect, asset, art }: Props) {
  return (
    <label
      className={cn(
        "group relative flex h-full cursor-pointer flex-col rounded-lg border bg-surface p-2 transition-[border-color,box-shadow] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
        checked ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]" : "border-line hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onSelect(value)} className="sr-only" aria-describedby={`${name}-${value}-d`} />
      {art ? (
        <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-line-strong bg-page text-primary-dark" aria-hidden>
          {art}
        </div>
      ) : (
        <SymptomImage asset={asset ?? null} />
      )}
      <span className="mt-2 flex items-start gap-2 px-1">
        <span className="min-w-0 flex-1 text-[15px] leading-snug font-semibold">{title}</span>
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            checked ? "border-primary bg-primary text-white" : "border-line-strong bg-surface",
          )}
          aria-hidden
        >
          {checked && <Check className="size-3" strokeWidth={3} />}
        </span>
      </span>
      <span id={`${name}-${value}-d`} className="mt-1 px-1 pb-1 text-sm leading-snug text-ink/70">
        {description}
      </span>
    </label>
  );
}
