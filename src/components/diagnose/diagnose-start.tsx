"use client";

import { ChevronRight, History, Printer, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { PhotoUpload } from "@/components/symptoms/photo-upload";
import { SymptomGrid, type SymptomView } from "@/components/symptoms/symptom-grid";
import { listSessions, useSavedPrinter, type StoredSession } from "@/lib/client/storage";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";
import { compact } from "@/lib/search/search";
import { PRINTER_TYPE_LABEL, type PrinterType, type SymptomCategory } from "@/lib/schema";
import { cn } from "@/lib/cn";
import { isVisual, symptomsForType, type AssetMap } from "@/lib/visual";

interface Props {
  categories: SymptomCategory[];
  symptoms: SymptomView[];
  assets: AssetMap;
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
  const [chosenSlug, setChosenSlug] = useState<string | null>(fromUrl && p.printers.some((x) => x.slug === fromUrl) ? fromUrl : null);
  /** True once the person says they do not want to use a printer this time. */
  const [cleared, setCleared] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [sessions, setSessions] = useState<{ flowId: string; session: StoredSession }[]>([]);
  const [errorQuery, setErrorQuery] = useState("");

  useEffect(() => setSessions(listSessions().filter((s) => p.flows.some((f) => f.id === s.flowId))), [p.flows]);

  const saved = p.printers.find((x) => x.slug === savedPrinter);
  // The saved setup is used automatically unless another printer is chosen or it is cleared.
  const printerSlug = chosenSlug ?? (cleared ? null : (saved?.slug ?? null));
  const printer = p.printers.find((x) => x.slug === printerSlug);
  const usingSaved = Boolean(printer && printer.slug === savedPrinter);
  // Printing technology: the printer's own, or the person's choice when no printer is selected.
  const urlType = params.get("type");
  const [chosenType, setChosenType] = useState<PrinterType>(urlType === "msla" ? "msla" : "fdm");
  const printerType: PrinterType = printer?.printerType ?? chosenType;
  const forType = symptomsForType(p.symptoms, printerType);
  const chooseType = (t: PrinterType) => {
    setChosenType(t);
    router.replace(t === "msla" ? "/diagnose?type=msla" : "/diagnose", { scroll: false });
  };

  const select = (slug: string | null) => {
    setChosenSlug(slug);
    setCleared(slug === null);
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
              <span>
                {usingSaved && <span className="text-muted">Using your </span>}
                <span className="font-medium">{printer.displayName}</span>
              </span>
            </p>
            <button type="button" className="text-sm font-medium text-primary-dark hover:underline" onClick={() => setChoosing(true)}>
              Change
            </button>
            <button type="button" className="text-sm text-muted hover:text-ink hover:underline" onClick={() => select(null)}>
              {usingSaved ? "Don't use a printer" : "Clear"}
            </button>
            {savedPrinter !== printer.slug && (
              <button type="button" className="text-sm font-medium text-primary-dark hover:underline" onClick={() => setSavedPrinter(printer.slug)}>
                Use as my setup
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

      <section aria-labelledby="type-heading" className="space-y-4">
        <h2 id="type-heading" className="sr-only">
          Printing technology
        </h2>
        {printer ? (
          <p className="text-sm text-ink/70">
            Showing problems for <span className="font-medium text-ink">{PRINTER_TYPE_LABEL[printerType]}</span> printers, from the {printer.displayName}&apos;s
            specifications.
          </p>
        ) : (
          <div role="group" aria-label="What kind of printer is it?" className="inline-flex rounded-lg border border-line-strong bg-surface p-1">
            {(["fdm", "msla"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={printerType === t}
                onClick={() => chooseType(t)}
                className={cn(
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  printerType === t ? "bg-primary-dark text-white" : "text-ink hover:bg-page",
                )}
              >
                {t === "fdm" ? "Filament printer (FDM)" : "Resin printer (MSLA)"}
              </button>
            ))}
          </div>
        )}
        <PhotoUpload />
        <SymptomGrid
          key={printerType}
          symptoms={forType.filter(isVisual)}
          otherProblems={forType.filter((s) => !isVisual(s))}
          categories={p.categories}
          assets={p.assets}
          printerType={printerType}
          printerSlug={printerSlug}
        />
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
