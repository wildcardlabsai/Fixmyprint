"use client";

import { CircleCheck, CircleHelp, OctagonAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useSavedPrinter } from "@/lib/client/storage";
import { checkFilamentCompatibility, type CompatLevel } from "@/lib/filament-compat";
import type { Filament, PrinterModel } from "@/lib/schema";

const ICON: Record<CompatLevel, React.ReactNode> = {
  ok: <CircleCheck className="size-4 text-success" aria-label="OK" />,
  caution: <TriangleAlert className="size-4 text-warning" aria-label="Caution" />,
  blocker: <OctagonAlert className="size-4 text-error" aria-label="Not suitable" />,
  unknown: <CircleHelp className="size-4 text-muted" aria-label="Unknown" />,
};

export function CompatChecker({ filament, printers, names }: { filament: Filament; printers: PrinterModel[]; names: Record<string, string> }) {
  const [saved] = useSavedPrinter();
  const [chosen, setChosen] = useState<string | null>(null);
  const slug = chosen ?? (saved && printers.some((p) => p.slug === saved) ? saved : "");
  const printer = printers.find((p) => p.slug === slug);
  const notes = printer ? checkFilamentCompatibility(filament, printer) : [];

  return (
    <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <label htmlFor="compat-printer" className="block font-semibold">
        Check {filament.name} against your printer
      </label>
      <select
        id="compat-printer"
        value={slug}
        onChange={(e) => setChosen(e.target.value)}
        className="mt-2 h-11 w-full max-w-sm rounded-md border border-line-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none"
      >
        <option value="">Choose a printer</option>
        {printers.map((p) => (
          <option key={p.slug} value={p.slug}>
            {names[p.slug]}
          </option>
        ))}
      </select>
      <div aria-live="polite">
        {printer && (
          <ul className="mt-4 space-y-2">
            {notes.map((n) => (
              <li key={n.topic} className="flex gap-2.5 text-[15px]">
                <span className="mt-0.5">{ICON[n.level]}</span>
                <span>
                  <span className="font-medium">{n.topic}: </span>
                  {n.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">Based on general starting ranges and the printer&apos;s recorded specifications. Unknown specifications are shown as unknown.</p>
    </div>
  );
}
