"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSavedPrinter } from "@/lib/client/storage";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { LinkButton } from "@/components/ui/button";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";

export function HomePrinterFinder({ printers, manufacturers }: { printers: PrinterOption[]; manufacturers: ManufacturerOption[] }) {
  const [savedPrinter, setSavedPrinter] = useSavedPrinter();
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = chosen ?? savedPrinter;
  const printer = printers.find((p) => p.slug === selected);

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {printer && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary-50 p-3.5 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              <span className="block text-muted">{printer.slug === savedPrinter ? "Your saved printer" : "Selected printer"}</span>
              <span className="text-[15px] font-semibold">{printer.displayName}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/diagnose?printer=${printer.slug}`} size="sm">
                Diagnose a problem
                <ArrowRight aria-hidden />
              </LinkButton>
              {printer.slug !== savedPrinter && (
                <button type="button" onClick={() => setSavedPrinter(printer.slug)} className="inline-flex h-9 items-center px-2 text-sm font-medium text-primary-dark hover:underline">
                  Save as my printer
                </button>
              )}
              <Link href={`/printers/${printer.slug}`} className="inline-flex h-9 items-center px-2 text-sm font-medium">
                Details
              </Link>
            </div>
          </div>
        )}
      </div>
      <PrinterPicker printers={printers} manufacturers={manufacturers} selected={selected} onSelect={setChosen} compactList />
    </div>
  );
}
