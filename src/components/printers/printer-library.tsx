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
  facts: { label: string; value: string }[];
  status: ReviewStatus;
}

interface Filter {
  key: "levelling" | "extruder" | "enclosure";
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
        <p className="text-xs leading-relaxed text-muted">Filters only match printers whose specification has been recorded. Printers with an unknown value are left out of a filtered list.</p>
      </div>

      <div className="min-w-0">
        <p className="mb-3 text-sm text-muted" role="status" aria-live="polite">
          {results.length} of {printers.length} {printers.length === 1 ? "printer" : "printers"}
        </p>
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface p-5 text-[15px]">
            <p className="font-medium">No printers match.</p>
            <p className="mt-1 text-muted">
              Your printer may not be documented yet. You can still <Link href="/diagnose">diagnose a problem from its symptoms</Link>.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {results.map((p) => (
              <li key={p.slug}>
                <Link href={`/printers/${p.slug}`} className="block h-full rounded-lg border border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-line-strong">
                  <span className="block text-sm text-muted">{p.manufacturerName}</span>
                  <span className="block text-[17px] font-semibold text-primary-dark">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted">{p.summary}</span>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    {p.facts.map((f) => (
                      <div key={f.label} className="contents">
                        <dt className="text-muted">{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <ReviewBadge status={p.status} className="mt-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
