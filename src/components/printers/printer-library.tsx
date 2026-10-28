"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ReviewBadge } from "@/components/ui/review-status";
import type { PrinterOption } from "@/lib/data/view-models";
import type { ReviewStatus } from "@/lib/schema";
import { matchPrinter } from "./printer-picker";

export interface LibraryPrinter extends PrinterOption {
  levelling: string | null;
  extruder: string | null;
  enclosure: string | null;
  /** Short facts shown as tags. Unknown facts are left out. */
  facts: string[];
  status: ReviewStatus;
}

interface Filter {
  key: "printerType" | "levelling" | "extruder" | "enclosure";
  label: string;
  options: { value: string; label: string }[];
}

export function PrinterLibrary({
  printers,
  manufacturers,
  filters,
}: {
  printers: LibraryPrinter[];
  manufacturers: { slug: string; name: string; modelCount: number }[];
  filters: Filter[];
}) {
  const [query, setQuery] = useState("");
  const [maker, setMaker] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const results = useMemo(
    () =>
      printers.filter(
        (p) =>
          (!maker || p.manufacturerSlug === maker) &&
          matchPrinter(p, query) &&
          filters.every((f) => !selected[f.key] || p[f.key] === selected[f.key]),
      ),
    [printers, maker, query, selected, filters],
  );

  const groups = manufacturers
    .map((m) => ({ slug: m.slug, name: m.name, items: results.filter((p) => p.manufacturerSlug === m.slug) }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const allUnreviewed = printers.every((p) => p.status === "unreviewed");

  const selectClass = "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="lib-q" className="mb-1.5 block text-sm font-medium">
            Search models
          </label>
          <Search className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted" aria-hidden />
          <input
            id="lib-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Model or manufacturer"
            className={`${selectClass} pl-9`}
          />
        </div>
        <div>
          <label htmlFor="lib-maker" className="mb-1.5 block text-sm font-medium">
            Manufacturer
          </label>
          <select id="lib-maker" value={maker} onChange={(e) => setMaker(e.target.value)} className={selectClass}>
            <option value="">All manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m.slug} value={m.slug} disabled={m.modelCount === 0}>
                {m.name} ({m.modelCount})
              </option>
            ))}
          </select>
        </div>
        {filters.map((f) => (
          <div key={f.key}>
            <label htmlFor={`lib-${f.key}`} className="mb-1.5 block text-sm font-medium">
              {f.label}
            </label>
            <select
              id={`lib-${f.key}`}
              value={selected[f.key] ?? ""}
              onChange={(e) => setSelected((s) => ({ ...s, [f.key]: e.target.value }))}
              className={selectClass}
            >
              <option value="">Any</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <p className="text-[13px] leading-relaxed text-ink/70">Filters only match printers whose specification has been recorded. Printers with an unknown value are left out of a filtered list.</p>
      </div>

      <div className="min-w-0">
        <p className="mb-3 text-sm text-muted" role="status" aria-live="polite">
          {results.length} of {printers.length} {printers.length === 1 ? "printer" : "printers"}
          {allUnreviewed && ". None has been reviewed by a second person yet; each printer page shows its sources."}
        </p>
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface p-5 text-[15px]">
            <p className="font-medium">No printers match.</p>
            <p className="mt-1 text-muted">
              Your printer may not be documented yet. You can still <Link href="/diagnose">diagnose a problem from its symptoms</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.slug} aria-labelledby={`maker-${g.slug}`}>
                <h2 id={`maker-${g.slug}`} className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
                  {g.name}
                  <span className="text-sm font-normal text-muted">{g.items.length}</span>
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {g.items.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/printers/${p.slug}`} className="block h-full rounded-lg border border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-line-strong">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-[17px] font-semibold text-primary-dark">{p.name}</span>
                          {p.status !== "unreviewed" && <ReviewBadge status={p.status} className="shrink-0" />}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm text-ink/75">{p.summary}</span>
                        {p.facts.length > 0 && (
                          <span className="mt-3 flex flex-wrap gap-1.5">
                            {p.facts.map((f) => (
                              <span key={f} className="rounded border border-line bg-page px-1.5 py-0.5 text-[13px] text-ink/80">
                                {f}
                              </span>
                            ))}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
