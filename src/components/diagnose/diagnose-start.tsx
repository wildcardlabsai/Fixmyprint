"use client";

import { ChevronRight, History, Printer, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryIcon } from "@/components/icons";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { listSessions, useSavedPrinter, type StoredSession } from "@/lib/client/storage";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";
import { compact } from "@/lib/search/search";
import type { SymptomCategory } from "@/lib/schema";

interface Props {
  categories: SymptomCategory[];
  symptoms: { slug: string; category: string; title: string; description: string; flowId: string | null }[];
  flows: { id: string; title: string }[];
  errorCodes: { slug: string; message: string; aliases: string[]; firmwareLabel: string }[];
  printers: PrinterOption[];
  manufacturers: ManufacturerOption[];
}

export function DiagnoseStart(p: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [savedPrinter, setSavedPrinter] = useSavedPrinter();
  const fromUrl = params.get("printer");
  const [printerSlug, setPrinterSlug] = useState<string | null>(fromUrl && p.printers.some((x) => x.slug === fromUrl) ? fromUrl : null);
  const [choosing, setChoosing] = useState(false);
  const [sessions, setSessions] = useState<{ flowId: string; session: StoredSession }[]>([]);
  const [errorQuery, setErrorQuery] = useState("");

  useEffect(() => setSessions(listSessions().filter((s) => p.flows.some((f) => f.id === s.flowId))), [p.flows]);

  const printer = p.printers.find((x) => x.slug === printerSlug);
  const saved = p.printers.find((x) => x.slug === savedPrinter);
  const suffix = printerSlug ? `?printer=${encodeURIComponent(printerSlug)}` : "";

  const select = (slug: string | null) => {
    setPrinterSlug(slug);
    setChoosing(false);
    router.replace(slug ? `/diagnose?printer=${encodeURIComponent(slug)}` : "/diagnose", { scroll: false });
  };

  const errorMatches = useMemo(() => {
    const q = compact(errorQuery);
    if (q.length < 2) return [];
    return p.errorCodes.filter((e) => [e.message, ...e.aliases].some((m) => compact(m).includes(q))).slice(0, 6);
  }, [errorQuery, p.errorCodes]);

  return (
    <div className="space-y-8">
      {sessions.length > 0 && (
        <section aria-labelledby="resume-heading" className="rounded-lg border border-line bg-surface p-4">
          <h2 id="resume-heading" className="flex items-center gap-2 font-semibold">
            <History className="size-4 text-muted" aria-hidden />
            Continue where you left off
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {sessions.map(({ flowId, session }) => {
              const flow = p.flows.find((f) => f.id === flowId)!;
              const pr = p.printers.find((x) => x.slug === session.printerSlug);
              return (
                <li key={flowId}>
                  <Link href={`/diagnose/${flowId}${session.printerSlug ? `?printer=${session.printerSlug}` : ""}`} className="flex items-center justify-between gap-3 py-2.5 text-ink no-underline hover:text-primary-dark">
                    <span>
                      <span className="block font-medium">{flow.title}</span>
                      <span className="block text-sm text-muted">
                        {Object.keys(session.answers).length} {Object.keys(session.answers).length === 1 ? "answer" : "answers"}
                        {pr ? ` · ${pr.displayName}` : ""} · {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="printer-heading" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <h2 id="printer-heading" className="text-lg font-semibold">
          <span className="mr-2 text-muted">1.</span>Your printer <span className="text-sm font-normal text-muted">(optional)</span>
        </h2>
        {printer && !choosing ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="flex flex-1 items-center gap-2">
              <Printer className="size-4 text-primary-dark" aria-hidden />
              <span className="font-medium">{printer.displayName}</span>
            </p>
            <button type="button" className="text-sm font-medium text-primary-dark hover:underline" onClick={() => setChoosing(true)}>
              Change
            </button>
            <button type="button" className="text-sm text-muted hover:text-ink hover:underline" onClick={() => select(null)}>
              Clear
            </button>
            {savedPrinter !== printer.slug && (
              <button type="button" className="text-sm font-medium text-primary-dark hover:underline" onClick={() => setSavedPrinter(printer.slug)}>
                Save as my printer
              </button>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {saved && !printer && (
              <button
                type="button"
                onClick={() => select(saved.slug)}
                className="flex w-full items-center gap-3 rounded-lg border border-primary/40 bg-primary-50 px-3.5 py-3 text-left hover:border-primary"
              >
                <Printer className="size-4 text-primary-dark" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm text-muted">Saved on this device</span>
                  <span className="block font-medium">Continue with {saved.displayName}</span>
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden />
              </button>
            )}
            <PrinterPicker printers={p.printers} manufacturers={p.manufacturers} selected={printerSlug} onSelect={select} compactList />
          </div>
        )}
      </section>

      <section aria-labelledby="symptom-heading">
        <h2 id="symptom-heading" className="text-lg font-semibold">
          <span className="mr-2 text-muted">2.</span>What is happening?
        </h2>
        <p className="mt-1 text-sm text-muted">Choose the closest description. You can start without choosing a printer.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {p.categories.map((c) => (
            <div key={c.slug} className="rounded-lg border border-line bg-surface">
              <h3 className="flex items-center gap-2 border-b border-line px-4 py-3 text-[15px] font-semibold">
                <CategoryIcon name={c.icon} className="size-4 text-primary-dark" />
                {c.title}
              </h3>
              <ul className="divide-y divide-line">
                {p.symptoms
                  .filter((s) => s.category === c.slug)
                  .map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={s.flowId ? `/diagnose/${s.flowId}${suffix}` : `/problems/${c.slug}`}
                        className="flex items-center gap-3 px-4 py-3 text-ink no-underline hover:bg-page"
                      >
                        <span className="flex-1 text-[15px]">{s.title}</span>
                        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="error-heading" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <h2 id="error-heading" className="text-lg font-semibold">
          Seeing an error message?
        </h2>
        <div className="relative mt-3 max-w-xl">
          <label htmlFor="error-search" className="mb-1.5 block text-sm font-medium">
            Type the message shown on the printer
          </label>
          <Search className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted" aria-hidden />
          <input
            id="error-search"
            type="search"
            autoComplete="off"
            value={errorQuery}
            onChange={(e) => setErrorQuery(e.target.value)}
            placeholder="For example Thermal Runaway or MINTEMP"
            className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div aria-live="polite">
          {errorMatches.length > 0 && (
            <ul className="mt-3 max-w-xl divide-y divide-line rounded-lg border border-line">
              {errorMatches.map((e) => (
                <li key={e.slug}>
                  <Link href={`/error-codes/${e.slug}`} className="block px-3.5 py-2.5 text-ink no-underline hover:bg-page">
                    <span className="block font-medium">{e.message}</span>
                    <span className="block text-sm text-muted">{e.firmwareLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {compact(errorQuery).length >= 2 && errorMatches.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              No match in the error list yet. Try <Link href={`/search?q=${encodeURIComponent(errorQuery)}`}>searching everything</Link>, or choose the closest problem above.
            </p>
          )}
        </div>
        <p className="mt-3 text-sm">
          <Link href="/error-codes">Browse all error messages</Link>
        </p>
      </section>
    </div>
  );
}
