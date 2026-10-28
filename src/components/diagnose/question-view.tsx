"use client";

import { ArrowLeft, Check, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";
import type { Question, SafetyNotice } from "@/lib/schema";

interface Props {
  question: Question;
  number: number;
  remaining: number;
  selectedOptionId?: string;
  editing: boolean;
  canGoBack: boolean;
  printerName: string | null;
  printers: PrinterOption[];
  manufacturers: ManufacturerOption[];
  safetyNotices: SafetyNotice[];
  focusOnMount: boolean;
  onAnswer: (optionId: string) => void;
  onBack: () => void;
  onCancelEdit: () => void;
  onChoosePrinter: (slug: string) => void;
}

export function QuestionView(p: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const { question: q } = p;
  const answered = p.number - 1;
  const total = answered + p.remaining;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Move focus to the new question so keyboard and screen reader users follow along.
  useEffect(() => {
    if (p.focusOnMount) heading.current?.focus();
    setShowPicker(false);
  }, [q.id, p.focusOnMount]);

  const printerCouldAnswer = Boolean(q.autoAnswer);

  return (
    <section aria-labelledby={`q-${q.id}`} className="rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <p className="font-medium text-ink">
            {p.editing ? "Changing an earlier answer" : `Question ${p.number}`}
          </p>
          {!p.editing && p.remaining > 1 && <p className="text-muted">Up to {p.remaining - 1} more</p>}
        </div>
        {!p.editing && (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Diagnosis progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(percent, 4)}%` }} />
          </div>
        )}
      </div>

      <h2 id={`q-${q.id}`} ref={heading} tabIndex={-1} className="text-xl leading-snug font-semibold outline-none sm:text-[22px]">
        {q.prompt}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        <span className="font-medium text-ink">Why we ask: </span>
        {q.why}
      </p>

      {q.help && <Notice className="mt-4">{q.help}</Notice>}
      <SafetyNotices ids={q.safety} notices={p.safetyNotices} className="mt-4" />

      {printerCouldAnswer && !p.printerName && (
        <div className="mt-4 rounded-lg border border-line bg-page p-3.5">
          <p className="flex items-start gap-2 text-sm">
            <Printer className="mt-0.5 size-4 shrink-0 text-primary-dark" aria-hidden />
            <span>
              Your printer&apos;s specifications can answer this.{" "}
              <button type="button" className="font-medium text-primary-dark underline" aria-expanded={showPicker} onClick={() => setShowPicker((s) => !s)}>
                {showPicker ? "Hide printer list" : "Choose your printer"}
              </button>
            </span>
          </p>
          {showPicker && (
            <div className="mt-3">
              <PrinterPicker printers={p.printers} manufacturers={p.manufacturers} onSelect={p.onChoosePrinter} compactList />
            </div>
          )}
        </div>
      )}
      {printerCouldAnswer && p.printerName && (
        <p className="mt-4 text-sm text-muted">We don&apos;t have this detail for the {p.printerName} yet, so please choose the answer that matches your printer.</p>
      )}

      <fieldset className="mt-5">
        <legend className="sr-only">{q.prompt}</legend>
        <div className="space-y-2.5">
          {q.options.map((o) => {
            const selected = o.id === p.selectedOptionId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => p.onAnswer(o.id)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  selected ? "border-primary bg-primary-50" : "border-line-strong bg-surface hover:border-primary hover:bg-primary-50/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-primary bg-primary text-white" : "border-line-strong",
                  )}
                  aria-hidden
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[16px] leading-snug", o.uncertain ? "text-ink/80" : "font-medium text-ink")}>{o.label}</span>
                  {o.detail && <span className="mt-0.5 block text-sm text-muted">{o.detail}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {p.editing ? (
          <Button variant="ghost" size="sm" onClick={p.onCancelEdit}>
            <ArrowLeft aria-hidden />
            Keep my previous answer
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={p.onBack} disabled={!p.canGoBack}>
            <ArrowLeft aria-hidden />
            Back
          </Button>
        )}
        {p.editing && <p className="text-sm text-muted">Choosing a new answer clears the answers after this question.</p>}
      </div>
    </section>
  );
}
