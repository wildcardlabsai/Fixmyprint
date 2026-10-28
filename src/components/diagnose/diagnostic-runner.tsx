"use client";

import { Printer, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrinterPicker } from "@/components/printers/printer-picker";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { Notice } from "@/components/ui/notice";
import { addHistory, keys, read, remove, sessionSchema, useSavedPrinter, write } from "@/lib/client/storage";
import type { ManufacturerOption, PrinterOption } from "@/lib/data/view-models";
import { factsFromPrinter } from "@/lib/engine/conditions";
import { answerQuestion, emptyState, evaluate, goBack, markTried, type DiagnosticState } from "@/lib/engine/engine";
import type { DiagnosticFlow, PrinterModel, SafetyNotice } from "@/lib/schema";
import { AnswersSummary } from "./answers-summary";
import { QuestionView } from "./question-view";
import { ResultView, type GuideSummary } from "./result-view";

export interface DiagnosticRunnerProps {
  flow: DiagnosticFlow;
  printers: PrinterModel[];
  printerOptions: PrinterOption[];
  manufacturerOptions: ManufacturerOption[];
  guides: GuideSummary[];
  safetyNotices: SafetyNotice[];
}

export function DiagnosticRunner(props: DiagnosticRunnerProps) {
  const { flow } = props;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const known = (slug: string | null) => (slug && props.printers.some((p) => p.slug === slug) ? slug : null);
  const initialPrinterSlug = known(params.get("printer"));
  /** Outcome the user just tried in a repair guide without success. */
  const initialTried = params.get("tried");
  const [savedPrinter, setSavedPrinter] = useSavedPrinter();
  const [printerSlug, setPrinterSlug] = useState<string | null>(initialPrinterSlug);
  const [state, setState] = useState<DiagnosticState>(emptyState);
  const [editing, setEditing] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [choosingPrinter, setChoosingPrinter] = useState(false);
  const interacted = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  const printer = props.printers.find((p) => p.slug === printerSlug) ?? null;
  const printerName = printerSlug ? (props.printerOptions.find((p) => p.slug === printerSlug)?.displayName ?? null) : null;
  const facts = useMemo(() => factsFromPrinter(printer), [printer]);
  const ev = useMemo(() => evaluate(flow, state, facts), [flow, state, facts]);

  // Restore a session saved on this device, then apply a "still not fixed" hand-back from a guide.
  useEffect(() => {
    const stored = read(keys.session(flow.id), sessionSchema);
    let next = emptyState();
    if (stored && stored.flowVersion === flow.version) {
      const explicitPrinter = initialPrinterSlug;
      if (!explicitPrinter || explicitPrinter === stored.printerSlug) {
        next = { answers: stored.answers, tried: stored.tried };
        if (!explicitPrinter) setPrinterSlug(known(stored.printerSlug));
        setResumed(Object.keys(stored.answers).length > 0);
      }
    }
    if (initialTried && flow.outcomes.some((o) => o.id === initialTried)) {
      next = markTried(next, initialTried);
      router.replace(printerSlugParam(pathname, initialPrinterSlug ?? known(stored?.printerSlug ?? null)), { scroll: false });
    }
    setState(next);
    setHydrated(true);
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress on this device.
  useEffect(() => {
    if (!hydrated) return;
    if (Object.keys(state.answers).length === 0 && state.tried.length === 0) remove(keys.session(flow.id));
    else write(keys.session(flow.id), { flowVersion: flow.version, printerSlug, answers: state.answers, tried: state.tried, updatedAt: Date.now() });
  }, [hydrated, state, printerSlug, flow.id, flow.version]);

  // Announce the next step for screen readers.
  useEffect(() => {
    if (!hydrated || !interacted.current) return;
    if (editing) return;
    if (ev.current) setAnnouncement(`Question ${ev.steps.length + 1}: ${ev.current.prompt}`);
    else if (ev.ranking[0]) setAnnouncement(`Diagnosis ready. Most likely cause: ${ev.ranking[0].outcome.title}`);
    else setAnnouncement("Diagnosis finished. More information is needed.");
  }, [hydrated, ev, editing]);

  const update = useCallback((next: DiagnosticState) => {
    interacted.current = true;
    setFixed(false);
    setState(next);
  }, []);

  const choosePrinter = (slug: string | null) => {
    interacted.current = true;
    setPrinterSlug(slug);
    setChoosingPrinter(false);
    router.replace(printerSlugParam(pathname, slug), { scroll: false });
  };

  const onAnswer = (questionId: string, optionId: string) => {
    const current = ev.steps.find((s) => s.question.id === questionId);
    if (editing && current?.option.id === optionId && current.source === "user") {
      setEditing(null);
      return;
    }
    update(answerQuestion(flow, state, questionId, optionId, facts));
    setEditing(null);
  };

  const restart = () => {
    update(emptyState());
    setEditing(null);
    setResumed(false);
  };

  const onFixed = () => {
    const top = ev.ranking[0];
    setFixed(true);
    addHistory({ guideSlug: top?.outcome.guideSlugs[0] ?? "", flowId: flow.id, outcomeId: top?.outcome.id ?? null, printerSlug, result: "fixed", at: Date.now() });
  };

  const editingQuestion = editing ? flow.questions.find((q) => q.id === editing) : undefined;
  const editingIndex = editing ? ev.steps.findIndex((s) => s.question.id === editing) : -1;
  const question = editingQuestion ?? ev.current;

  const feedbackContext = {
    flowId: flow.id,
    flowVersion: flow.version,
    printerSlug,
    answers: Object.fromEntries(ev.steps.map((s) => [s.question.id, s.option.id])),
    ranking: ev.ranking.map((r) => ({ id: r.outcome.id, score: r.score })),
    tried: state.tried,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="min-w-0 space-y-4">
        <p className="sr-only" aria-live="polite" role="status">
          {announcement}
        </p>

        {/* Printer and fault summary */}
        <div className="rounded-lg border border-line bg-surface p-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <p className="flex min-w-0 items-center gap-2">
              <Printer className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="text-muted">Printer:</span>
              <span className="truncate font-medium">{printerName ?? "Not selected"}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="font-medium text-primary-dark hover:underline" aria-expanded={choosingPrinter} onClick={() => setChoosingPrinter((c) => !c)}>
                {printerName ? "Change printer" : "Choose printer"}
              </button>
              {printerName && (
                <button type="button" className="text-muted hover:text-ink hover:underline" onClick={() => choosePrinter(null)}>
                  Clear
                </button>
              )}
              {!printerName && savedPrinter && savedPrinter !== printerSlug && props.printers.some((p) => p.slug === savedPrinter) && (
                <button type="button" className="font-medium text-primary-dark hover:underline" onClick={() => choosePrinter(savedPrinter)}>
                  Use my saved printer
                </button>
              )}
            </div>
            <button type="button" onClick={restart} className="ml-auto inline-flex items-center gap-1.5 text-muted hover:text-ink">
              <RotateCcw className="size-4" aria-hidden />
              Start again
            </button>
          </div>
          {choosingPrinter && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted">Choosing a printer fills in answers its specifications already give.</p>
                <button type="button" onClick={() => setChoosingPrinter(false)} className="rounded-sm p-1 text-muted hover:text-ink">
                  <X className="size-4" aria-hidden />
                  <span className="sr-only">Close printer list</span>
                </button>
              </div>
              <PrinterPicker printers={props.printerOptions} manufacturers={props.manufacturerOptions} selected={printerSlug} onSelect={choosePrinter} compactList />
            </div>
          )}
          {printerSlug && printerSlug !== savedPrinter && printerName && (
            <p className="mt-2 text-sm">
              <button type="button" className="text-primary-dark hover:underline" onClick={() => setSavedPrinter(printerSlug)}>
                Save {printerName} as my printer on this device
              </button>
            </p>
          )}
        </div>

        {resumed && Object.keys(state.answers).length > 0 && (
          <Notice title="Picked up where you left off">
            Your earlier answers were saved on this device.{" "}
            <button type="button" className="font-medium text-primary-dark underline" onClick={restart}>
              Start again instead
            </button>
          </Notice>
        )}

        {!hydrated ? (
          <div className="h-80 animate-pulse rounded-lg border border-line bg-surface" aria-hidden />
        ) : (
          <>
            {ev.steps.length === 0 && !editing && <SafetyNotices ids={flow.safety} notices={props.safetyNotices} />}
            {question ? (
              <QuestionView
                key={question.id}
                question={question}
                number={editingQuestion ? editingIndex + 1 : ev.steps.length + 1}
                remaining={ev.remaining}
                selectedOptionId={editingQuestion ? ev.steps[editingIndex]?.option.id : undefined}
                editing={Boolean(editingQuestion)}
                canGoBack={ev.steps.some((s) => s.source === "user")}
                printerName={printerName}
                printers={props.printerOptions}
                manufacturers={props.manufacturerOptions}
                safetyNotices={props.safetyNotices}
                focusOnMount={interacted.current}
                onAnswer={(o) => onAnswer(question.id, o)}
                onBack={() => update(goBack(flow, state, facts))}
                onCancelEdit={() => setEditing(null)}
                onChoosePrinter={(slug) => choosePrinter(slug)}
              />
            ) : (
              <ResultView
                flow={flow}
                evaluation={ev}
                guides={props.guides}
                safetyNotices={props.safetyNotices}
                printerSlug={printerSlug}
                fixed={fixed}
                onFixed={onFixed}
                onNotFixed={(id) => update(markTried(state, id))}
                onUntry={(id) => update({ ...state, tried: state.tried.filter((t) => t !== id) })}
                onRestart={restart}
                onReviewAnswers={() => document.getElementById("your-answers")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                feedbackContext={feedbackContext}
              />
            )}
          </>
        )}
      </div>

      <aside aria-labelledby="your-answers" className="rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-20">
        <h2 id="your-answers" className="mb-3 scroll-mt-24 font-semibold">
          Your answers
        </h2>
        <AnswersSummary steps={ev.steps} editing={editing} onChange={(id) => { interacted.current = true; setEditing(id); }} />
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          Saved on this device only, so you can come back to it. <Link href="/privacy">Privacy</Link>
        </p>
      </aside>
    </div>
  );
}

function printerSlugParam(pathname: string, slug: string | null) {
  return slug ? `${pathname}?printer=${encodeURIComponent(slug)}` : pathname;
}
