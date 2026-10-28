"use client";

import { ArrowRight, Check, CircleCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { Button, LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { addHistory, guideProgressSchema, keys, read, remove, useSavedPrinter, write } from "@/lib/client/storage";
import { cn } from "@/lib/cn";
import { evaluateCondition, factsFromPrinter } from "@/lib/engine/conditions";
import { visibleSteps } from "@/lib/guide-steps";
import type { Guide, PrinterModel, SafetyNotice } from "@/lib/schema";
import { GuideDiagram } from "./diagrams";

interface Props {
  guide: Guide;
  printers: Pick<PrinterModel, "slug" | "name" | "specs">[];
  printerNames: Record<string, string>;
  safetyNotices: SafetyNotice[];
  flowTitles: Record<string, string>;
  guideTitles: Record<string, string>;
}

export function GuideRunner({ guide, printers, printerNames, safetyNotices, flowTitles, guideTitles }: Props) {
  const params = useSearchParams();
  const [savedPrinter] = useSavedPrinter();
  const fromFlow = params.get("from");
  const fromOutcome = params.get("outcome");
  const urlPrinter = params.get("printer");
  const printerSlug = [urlPrinter, savedPrinter].find((s) => s && printers.some((p) => p.slug === s)) ?? null;
  const printer = printers.find((p) => p.slug === printerSlug) ?? null;
  const printerFacts = useMemo(() => factsFromPrinter(printer as PrinterModel | null), [printer]);

  const selector = guide.hardwareSelector;
  const factFromPrinter = selector ? printerFacts[selector.fact] : undefined;
  const printerValueOffered = factFromPrinter && selector?.options.some((o) => o.value === factFromPrinter) ? factFromPrinter : undefined;

  const [completed, setCompleted] = useState<string[]>([]);
  const [hardware, setHardware] = useState<string | null>(null);
  const [result, setResult] = useState<"fixed" | "not-fixed" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    const stored = read(keys.guide(guide.slug), guideProgressSchema);
    if (stored) {
      setCompleted(stored.completed.filter((id) => guide.steps.some((s) => s.id === id)));
      setHardware(stored.hardware);
      setResumed(stored.completed.length > 0 && !stored.result);
    }
    setHydrated(true);
  }, [guide]);

  useEffect(() => {
    if (!hydrated) return;
    if (completed.length === 0 && !hardware && !result) remove(keys.guide(guide.slug));
    else write(keys.guide(guide.slug), { completed, hardware, result, updatedAt: Date.now() });
  }, [hydrated, completed, hardware, result, guide.slug]);

  // An explicit choice wins over the printer's specification (for example after a hardware upgrade).
  const hardwareValue = hardware ?? printerValueOffered ?? null;
  const facts = useMemo(
    () => (selector && hardwareValue ? { ...printerFacts, [selector.fact]: hardwareValue } : printerFacts),
    [printerFacts, selector, hardwareValue],
  );
  const steps = visibleSteps(guide, facts);
  const doneCount = steps.filter((s) => completed.includes(s.step.id)).length;
  const allDone = doneCount === steps.length;

  const toggle = (id: string) => setCompleted((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const finish = (r: "fixed" | "not-fixed") => {
    setResult(r);
    addHistory({ guideSlug: guide.slug, flowId: fromFlow, outcomeId: fromOutcome, printerSlug, result: r, at: Date.now() });
  };

  const notFixedHref = (() => {
    if (fromFlow && flowTitles[fromFlow]) {
      const p = new URLSearchParams();
      if (fromOutcome) p.set("tried", fromOutcome);
      if (printerSlug) p.set("printer", printerSlug);
      return { href: `/diagnose/${fromFlow}?${p}`, label: "Back to the diagnosis: show the next cause" };
    }
    if (guide.ifFails.flowId && flowTitles[guide.ifFails.flowId]) {
      return { href: `/diagnose/${guide.ifFails.flowId}${printerSlug ? `?printer=${printerSlug}` : ""}`, label: `Diagnose: ${flowTitles[guide.ifFails.flowId]}` };
    }
    return null;
  })();

  const guideFits = !guide.appliesWhen || evaluateCondition(guide.appliesWhen, { facts: printerFacts, answers: {} }) !== false;

  return (
    <div className="space-y-5">
      {printer && !guideFits && (
        <Notice tone="warning" title={`This guide does not apply to the ${printerNames[printer.slug]}`}>
          {guide.appliesNote}{" "}
          {guide.ifFails.guideSlugs[0] && <Link href={`/guides/${guide.ifFails.guideSlugs[0]}?printer=${printer.slug}`}>Go to the guide that fits this printer</Link>}
        </Notice>
      )}
      {printer && (
        <p className="text-sm text-muted">
          Showing steps for the <span className="font-medium text-ink">{printerNames[printer.slug]}</span>
          {urlPrinter ? "" : " (saved as your printer on this device)"}.
        </p>
      )}

      {selector && (
        <fieldset className="rounded-lg border border-line bg-surface p-4">
          <legend className="px-1 text-[15px] font-semibold">{selector.prompt}</legend>
          {printerValueOffered && !hardware && (
            <p className="mb-2 text-sm text-muted">Selected from your printer&apos;s specifications. Change it if your printer has been modified.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {selector.options.map((o) => {
              const active = hardwareValue === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setHardware(active && hardware ? null : o.value)}
                  className={cn(
                    "rounded-md border px-3 py-2.5 text-left transition-colors",
                    active ? "border-primary bg-primary-50" : "border-line-strong hover:border-primary",
                  )}
                >
                  <span className="block text-[15px] font-medium">{o.label}</span>
                  {o.detail && <span className="block text-sm text-muted">{o.detail}</span>}
                </button>
              );
            })}
          </div>
          {!hardwareValue && <p className="mt-2 text-sm text-muted">Not sure? All steps are shown below, each labelled with the hardware it applies to.</p>}
        </fieldset>
      )}

      {resumed && (
        <Notice title="Your progress was saved on this device">
          {doneCount} of {steps.length} steps are ticked off.{" "}
          <button type="button" className="font-medium text-primary-dark underline" onClick={() => { setCompleted([]); setResumed(false); setResult(null); }}>
            Start from the beginning
          </button>
        </Notice>
      )}

      <div className="sticky top-16 z-10 -mx-4 border-b border-line bg-page/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p role="status" aria-live="polite" className="font-medium">
            {doneCount} of {steps.length} steps done
          </p>
          {doneCount > 0 && (
            <button type="button" onClick={() => setCompleted([])} className="inline-flex items-center gap-1 text-muted hover:text-ink">
              <RotateCcw className="size-3.5" aria-hidden />
              Clear ticks
            </button>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map(({ step, conditional }, i) => {
          const done = completed.includes(step.id);
          return (
            <li key={step.id} className={cn("rounded-lg border bg-surface p-4 sm:p-5", done ? "border-success/40" : "border-line")}>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-pressed={done}
                  aria-label={done ? `Step ${i + 1} done. Mark as not done` : `Mark step ${i + 1} as done`}
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    done ? "border-success bg-success text-white" : "border-line-strong hover:border-primary",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <span className="text-xs font-semibold text-muted">{i + 1}</span>}
                </button>
                <div className="min-w-0 flex-1">
                  {conditional && step.appliesLabel && <p className="mb-1 text-xs font-semibold tracking-wide text-primary-dark uppercase">{step.appliesLabel} only</p>}
                  <h3 className={cn("text-[17px] font-semibold", done && "text-muted")}>{step.title}</h3>
                  <div className={cn("prose-body mt-2", done && "text-muted")}>
                    {step.body.map((b) => (
                      <p key={b}>{b}</p>
                    ))}
                  </div>
                  {step.warning && (
                    <Notice tone="warning" className="mt-3" title="Warning">
                      {step.warning}
                    </Notice>
                  )}
                  {step.tip && <p className="mt-3 text-sm text-muted">Tip: {step.tip}</p>}
                  {step.diagram && <GuideDiagram id={step.diagram} />}
                  {!done && <SafetyNotices ids={step.safety.filter((s) => !guide.safety.includes(s))} notices={safetyNotices} className="mt-3" />}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="outcome-heading" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <h2 id="outcome-heading" className="text-lg font-semibold">
          Did it work?
        </h2>
        {!allDone && !result && <p className="mt-1 text-sm text-muted">Tick off the steps as you go. You can answer this at any point.</p>}
        {result === "fixed" ? (
          <Notice tone="success" className="mt-3" title="Glad it is fixed.">
            Noted on this device. If the problem comes back, the diagnosis will pick up from here.
          </Notice>
        ) : result === "not-fixed" ? (
          <div className="mt-3 space-y-3">
            <p className="text-[15px]">{guide.ifFails.text}</p>
            {guide.ifFails.escalation && <Notice tone="warning">{guide.ifFails.escalation}</Notice>}
            <div className="flex flex-wrap gap-2">
              {notFixedHref && (
                <LinkButton href={notFixedHref.href}>
                  {notFixedHref.label}
                  <ArrowRight aria-hidden />
                </LinkButton>
              )}
              {guide.ifFails.guideSlugs.map((s) => (
                <LinkButton key={s} href={`/guides/${s}${printerSlug ? `?printer=${printerSlug}` : ""}`} variant="secondary">
                  {guideTitles[s] ?? s}
                </LinkButton>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => finish("fixed")}>
              <CircleCheck className="text-success" aria-hidden />
              This fixed it
            </Button>
            <Button variant="secondary" onClick={() => finish("not-fixed")}>
              Still not fixed
            </Button>
          </div>
        )}
        {result && (
          <button type="button" onClick={() => setResult(null)} className="mt-3 text-sm text-muted hover:text-ink hover:underline">
            Change my answer
          </button>
        )}
        {fromFlow && flowTitles[fromFlow] && !result && (
          <p className="mt-3 text-sm">
            <Link href={`/diagnose/${fromFlow}${printerSlug ? `?printer=${printerSlug}` : ""}`}>Back to the diagnosis</Link>
          </p>
        )}
      </section>
    </div>
  );
}
