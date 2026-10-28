"use client";

import { Check, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";
import { compact, tokens } from "@/lib/search/search";

export function matchPrinter(p: PrinterOption, query: string): boolean {
  const q = compact(query);
  if (!q) return true;
  const names = [p.displayName, p.name, `${p.manufacturerName} ${p.name}`, ...p.aliases];
  if (names.some((n) => compact(n).includes(q))) return true;
  const hay = new Set(names.flatMap(tokens));
  return tokens(query).every((t) => [...hay].some((h) => h.startsWith(t)));
}

interface Props {
  printers: PrinterOption[];
  manufacturers: ManufacturerOption[];
  selected?: string | null;
  onSelect: (slug: string) => void;
  /** Heading level context: the picker renders its own labelled region. */
  label?: string;
  compactList?: boolean;
}

/**
 * Search-as-you-type printer selector with manufacturer filters. Model counts
 * are derived from the printer records actually present.
 */
export function PrinterPicker({ printers, manufacturers, selected, onSelect, label = "Search by manufacturer or model", compactList }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [maker, setMaker] = useState<string | null>(null);

  const results = useMemo(
    () => printers.filter((p) => (!maker || p.manufacturerSlug === maker) && matchPrinter(p, query)),
    [printers, maker, query],
  );
  const withModels = manufacturers.filter((m) => m.modelCount > 0);
  const withoutModels = manufacturers.filter((m) => m.modelCount === 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor={`${id}-q`} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
        <Search className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted" aria-hidden />
        <input
          id={`${id}-q`}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="For example Ender-3 V2, P1S or MK4"
          className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="sr-only">Filter by manufacturer</legend>
        <div className="flex flex-wrap gap-1.5">
          <FilterButton active={maker === null} onClick={() => setMaker(null)}>
            All
          </FilterButton>
          {withModels.map((m) => (
            <FilterButton key={m.slug} active={maker === m.slug} onClick={() => setMaker(maker === m.slug ? null : m.slug)}>
              {m.name} <span className="text-muted">{m.modelCount}</span>
            </FilterButton>
          ))}
        </div>
      </fieldset>

      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "printer" : "printers"} found
      </p>

      {results.length > 0 ? (
        <ul className={cn("divide-y divide-line overflow-auto rounded-lg border border-line bg-surface", compactList ? "max-h-64" : "max-h-80")}>
          {results.map((p) => {
            const isSelected = selected === p.slug;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(p.slug)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-page",
                    isSelected && "bg-primary-50 hover:bg-primary-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-ink">{p.displayName}</span>
                    <span className="block truncate text-sm text-muted">{p.summary}</span>
                  </span>
                  {isSelected && <Check className="size-5 shrink-0 text-primary-dark" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">
          <p className="font-medium text-ink">No matching printer in the library yet.</p>
          <p className="mt-1">You can still diagnose a problem by choosing a symptom. We will ask about your printer&apos;s hardware where it matters.</p>
        </div>
      )}

      {withoutModels.length > 0 && (
        <p className="text-xs leading-relaxed text-muted">
          Not yet documented: {withoutModels.map((m) => m.name).join(", ")}. The library is still being built.
        </p>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors",
        active ? "border-primary bg-primary-50 font-medium text-primary-dark" : "border-line bg-surface text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}
