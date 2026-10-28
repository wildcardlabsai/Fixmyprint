"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { SlicerSelect } from "@/components/slicers/slicer-select";
import { Button } from "@/components/ui/button";
import { useSlicerChoice } from "@/lib/client/setup";
import { useSavedPrinter } from "@/lib/client/storage";
import { cn } from "@/lib/cn";
import type { ManufacturerOption, PrinterOption, SlicerChoice, SlicerOption } from "@/lib/data/view-models";

export interface SetupData {
  printers: PrinterOption[];
  manufacturers: ManufacturerOption[];
  slicers: SlicerOption[];
  slicerChoices: Record<string, SlicerChoice[]>;
}

/** The person's saved printer and slicer, read from this device. */
export function useSetup(data: SetupData) {
  const [savedPrinter, setPrinter] = useSavedPrinter();
  const printer = data.printers.find((p) => p.slug === savedPrinter) ?? null;
  const forPrinter = printer ? (data.slicerChoices[printer.slug] ?? []) : [];
  const slicerChoice = useSlicerChoice(
    forPrinter,
    data.slicers.map((s) => s.slug),
  );
  const slicer = data.slicers.find((s) => s.slug === slicerChoice.slug) ?? null;
  return { printer, setPrinter, forPrinter, slicer, ...slicerChoice };
}

/** Header button showing the saved setup. */
export function SetupButton({ data, open, onToggle }: { data: SetupData; open: boolean; onToggle: () => void }) {
  const { printer, slicer } = useSetup(data);
  const summary = printer ? [printer.name, slicer?.name].filter(Boolean).join(" · ") : "My setup";
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="setup-panel"
      onClick={onToggle}
      title={printer ? `My setup: ${summary}` : "Set your printer and slicer"}
      className={cn(
        "inline-flex h-9 max-w-56 items-center gap-2 rounded-md border px-2.5 text-sm font-medium transition-colors",
        open ? "border-primary bg-primary-50 text-primary-dark" : "border-line-strong text-ink hover:border-primary",
      )}
    >
      <Printer className="size-4 shrink-0" aria-hidden />
      <span className="sr-only min-w-0 xl:not-sr-only xl:truncate">{summary}</span>
      <span className="sr-only">{printer ? ": change my setup" : ": set your printer and slicer"}</span>
    </button>
  );
}

/** Lets people save their printer and slicer once; guides, diagnoses and slicer names use it everywhere. */
export function SetupPanel({ data, onDone }: { data: SetupData; onDone: () => void }) {
  const setup = useSetup(data);
  const [choosing, setChoosing] = useState(!setup.printer);

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_300px] md:gap-10">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">Your printer</h2>
        {setup.printer && !choosing ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-[15px] font-medium">{setup.printer.displayName}</p>
            <button type="button" className="text-sm font-medium text-primary-dark hover:underline" onClick={() => setChoosing(true)}>
              Change printer
            </button>
            <Link href={`/printers/${setup.printer.slug}`} className="text-sm">
              Printer details
            </Link>
          </div>
        ) : (
          <div className="mt-2">
            <PrinterPicker
              printers={data.printers}
              manufacturers={data.manufacturers}
              selected={setup.printer?.slug ?? null}
              onSelect={(slug) => {
                setup.setPrinter(slug);
                setChoosing(false);
              }}
              compactList
            />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold">
          <label htmlFor="setup-slicer">Your slicer</label>
        </h2>
        <SlicerSelect id="setup-slicer" className="mt-2" slicers={data.slicers} forPrinter={setup.forPrinter} value={setup.slug} onChange={setup.setSlicer} />
        <p className="mt-1.5 text-xs text-ink/70">
          {setup.isDefault
            ? "Your printer maker's own slicer. Change it if you use another."
            : setup.slug
              ? "Guides and results show setting names for this slicer."
              : "Guides and results will show setting names for this slicer."}
        </p>
        <p className="mt-4 text-xs text-ink/70">Saved in this browser only. Nothing is sent to us.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
          {(setup.printer || setup.saved) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setup.setPrinter(null);
                setup.setSlicer(null);
                setChoosing(true);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
