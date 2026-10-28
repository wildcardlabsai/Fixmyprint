"use client";

import { cn } from "@/lib/cn";
import type { SlicerChoice, SlicerOption } from "@/lib/data/view-models";

interface Props {
  id: string;
  slicers: SlicerOption[];
  forPrinter: SlicerChoice[];
  value: string | null;
  onChange: (slug: string | null) => void;
  className?: string;
}

/** Slicer dropdown with the slicers named for the printer listed first. */
export function SlicerSelect({ id, slicers, forPrinter, value, onChange, className }: Props) {
  const named = forPrinter.map((c) => ({ ...c, name: slicers.find((s) => s.slug === c.slug)?.name ?? c.slug }));
  const others = slicers.filter((s) => !forPrinter.some((c) => c.slug === s.slug));
  return (
    <select
      id={id}
      className={cn(
        "block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {!value && <option value="">Choose your slicer</option>}
      {named.length > 0 && (
        <optgroup label="Named by your printer's maker">
          {named.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
              {s.official ? " (official)" : ""}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={named.length > 0 ? "Other slicers" : "Slicers"}>
        {others.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
