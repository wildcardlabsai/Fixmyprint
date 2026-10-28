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
import { answerQuestion, applyAnswers, emptyState, evaluate, goBack, markTried, type DiagnosticState } from "@/lib/engine/engine";
import { PhotoUpload } from "@/components/symptoms/photo-upload";
import type { SymptomView } from "@/components/symptoms/symptom-grid";
import { SymptomImage } from "@/components/symptoms/symptom-image";
import { PRINTER_TYPE_LABEL, type DiagnosticFlow, type Guide, type PrinterModel, type SafetyNotice, type Slicer, type Symptom } from "@/lib/schema";
import { pickImage, symptomForAnswers, type AssetMap } from "@/lib/visual";
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
  slicers: Slicer[];
  /** This flow's symptoms, so a chosen picture can be shown and its answers filled in. */
  symptoms: (SymptomView & Pick<Symptom, "preset">)[];
  assets: AssetMap;
  /** Full guides for this flow's causes, so the result can show their steps. */
  fullGuides: Guide[];
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
  /** A symptom chosen from the pictures, whose answers are filled in. */
  const initialSymptom = params.get("symptom");
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
    // With no printer in the link or the saved session, use the setup saved on this device.
    if (!initialPrinterSlug && !(stored && stored.flowVersion === flow.version && stored.printerSlug)) {
      try {
        const fromSetup = known(window.localStorage.getItem(keys.printer));
        if (fromSetup) setPrinterSlug(fromSetup);
      } catch {
        // Storage unavailable: carry on without a printer.
      }
    }
    // A symptom chosen by its picture fills in the answers it already gives.
    const chosen = initialSymptom ? props.symptoms.find((s) => s.slug === initialSymptom && s.flowId === flow.id) : undefined;
    if (chosen && Object.keys(chosen.preset).length > 0) {
      const alreadyMatches = Object.entries(chosen.preset).every(([q, o]) => next.answers[q] === o);
      if (!alreadyMatches) {
        next = applyAnswers(flow, chosen.preset);
        setResumed(false);
      }
      router.replace(printerSlugParam(pathname, initialPrinterSlug), { scroll: false });
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
  const symptom = symptomForAnswers(props.symptoms, flow.id, state.answers);
  const symptomImage = symptom ? pickImage(props.assets, symptom.images) : null;
  const wrongType = printer && !flow.printerTypes.includes(printer.specs.printerType);

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
              {printerSlug && printerSlug === savedPrinter && <span className="shrink-0 text-muted">(your setup)</span>}
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
                Use {printerName} as my setup
              </button>
            </p>
          )}
          {!printer && <p className="mt-2 text-sm text-ink/70">Without a printer, the questions and instructions are general. Choose your printer to tailor them to its hardware.</p>}
        </div>

        {wrongType && printer && (
          <Notice tone="warning" title={`This diagnosis is for ${flow.printerTypes.map((t) => PRINTER_TYPE_LABEL[t]).join(" and ")} printers`}>
            The {printerName} is a {PRINTER_TYPE_LABEL[printer.specs.printerType]} printer, so most of this will not apply.{" "}
            <Link href={`/diagnose?printer=${printer.slug}`}>Choose a problem for this printer</Link>
          </Notice>
        )}

        {symptom && (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5">
            <SymptomImage asset={symptomImage} className="w-24 shrink-0 sm:w-28" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-ink/70">The problem you chose</p>
              <p className="text-[15px] font-semibold">{symptom.title}</p>
              <Link href={`/diagnose${printerSlug ? `?printer=${printerSlug}` : ""}`} className="text-sm">
                Choose a different problem
              </Link>
            </div>
          </div>
        )}

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
                assets={props.assets}
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
                slicers={props.slicers}
                printers={props.printers}
                printerSlug={printerSlug}
                printer={printer}
                printerName={printerName}
                reported={symptom ? { title: symptom.title, asset: symptomImage } : null}
                fullGuides={props.fullGuides}
                assets={props.assets}
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

      <div className="space-y-4 lg:sticky lg:top-20">
        <aside aria-labelledby="your-answers" className="rounded-lg border border-line bg-surface p-4">
          <h2 id="your-answers" className="mb-3 scroll-mt-24 font-semibold">
            Your answers
          </h2>
          <AnswersSummary steps={ev.steps} editing={editing} onChange={(id) => { interacted.current = true; setEditing(id); }} />
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink/70">
            Saved on this device only, so you can come back to it. <Link href="/privacy">Privacy</Link>
          </p>
        </aside>
        <PhotoUpload compact />
      </div>
    </div>
  );
}

function printerSlugParam(pathname: string, slug: string | null) {
  return slug ? `${pathname}?printer=${encodeURIComponent(slug)}` : pathname;
}
