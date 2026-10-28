"use client";

import { ArrowRight, ChevronDown, CircleCheck, Flag, RotateCcw, Undo2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { SlicerSettingsPanel } from "@/components/slicers/slicer-settings-panel";
import { Button, LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { applicableChecks, evaluateCondition } from "@/lib/engine/conditions";
import type { Contribution, Evaluation, RankedOutcome } from "@/lib/engine/engine";
import { TroubleshootingStep } from "@/components/guides/troubleshooting-step";
import { SymptomImage } from "@/components/symptoms/symptom-image";
import { useUploadedPhoto } from "@/lib/client/storage";
import { visibleSteps } from "@/lib/guide-steps";
import { specFactsUsed } from "@/lib/printer-labels";
import type { Condition, DiagnosticFlow, Guide, PrinterModel, SafetyNotice, Slicer, VisualAsset } from "@/lib/schema";
import type { AssetMap } from "@/lib/visual";
import { CONFIDENCE, ConfidenceBadge } from "./confidence";

export interface GuideSummary {
  slug: string;
  title: string;
  summary: string;
  appliesWhen?: Condition;
}

interface Props {
  flow: DiagnosticFlow;
  evaluation: Evaluation;
  guides: GuideSummary[];
  safetyNotices: SafetyNotice[];
  slicers: Slicer[];
  printers: Pick<PrinterModel, "slug" | "manufacturer">[];
  printerSlug: string | null;
  /** The selected printer and its display name, so confirmed specifications can be listed. */
  printer: PrinterModel | null;
  printerName: string | null;
  /** The problem the person picked, with its example image. */
  reported: { title: string; asset: VisualAsset | null } | null;
  /** Full guides for this flow's causes, to show their steps on the result. */
  fullGuides: Guide[];
  assets: AssetMap;
  fixed: boolean;
  onFixed: () => void;
  onNotFixed: (outcomeId: string) => void;
  onUntry: (outcomeId: string) => void;
  onRestart: () => void;
  onReviewAnswers: () => void;
  feedbackContext: Record<string, unknown>;
}

/** Merges repeated reasons so the list reads cleanly. */
function reasons(list: Contribution[]): string[] {
  const out = new Set<string>();
  for (const c of list) {
    if (c.kind === "rule" && c.reason) out.add(c.reason);
    // The full questions are in "Your answers"; the answer on its own reads faster here.
    else if (c.answerLabel) out.add(c.answerLabel);
  }
  return [...out];
}

function guideHref(slug: string, flowId: string, outcomeId: string, printerSlug: string | null) {
  const p = new URLSearchParams({ from: flowId, outcome: outcomeId });
  if (printerSlug) p.set("printer", printerSlug);
  return `/guides/${slug}?${p}`;
}

export function ResultView(p: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [reporting, setReporting] = useState(false);
  const top = p.evaluation.ranking[0];
  const others = p.evaluation.ranking.slice(1);
  // Guides that definitely do not fit this printer's hardware are left out.
  const guidesFor = (r: RankedOutcome) =>
    r.outcome.guideSlugs
      .map((s) => p.guides.find((g) => g.slug === s))
      .filter((g): g is GuideSummary => Boolean(g))
      .filter((g) => !g.appliesWhen || evaluateCondition(g.appliesWhen, { facts: p.evaluation.facts, answers: {} }) !== false);

  useEffect(() => {
    heading.current?.focus();
  }, [top?.outcome.id]);

  if (!top) {
    return (
      <section aria-labelledby="result-heading" className="space-y-4 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-6">
        <h2 id="result-heading" ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none sm:text-[22px]">
          {p.evaluation.tried.length > 0 ? "You have tried every likely cause we found" : p.flow.insufficient.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted">
          {p.evaluation.tried.length > 0
            ? "None of the remaining causes fit your answers well enough to suggest them. These checks will give a clearer picture."
            : p.flow.insufficient.explanation}
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px]">
          {p.flow.insufficient.checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <Notice>
          If the printer has a fault you are not comfortable investigating, contact the manufacturer&apos;s support. Never disable safety features to get past an error.
        </Notice>
        <TriedList tried={p.evaluation.tried} onUntry={p.onUntry} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" onClick={p.onReviewAnswers}>
            Review my answers
          </Button>
          <Button variant="ghost" onClick={p.onRestart}>
            <RotateCcw aria-hidden />
            Start again
          </Button>
        </div>
      </section>
    );
  }

  const topGuides = guidesFor(top);
  const topGuide = topGuides[0] ? (p.fullGuides.find((g) => g.slug === topGuides[0]!.slug) ?? null) : null;
  const steps = topGuide ? visibleSteps(topGuide, p.evaluation.facts) : [];
  const specsUsed = p.printer ? specFactsUsed(p.printer) : [];
  const supporting = reasons(top.supporting);
  const against = reasons(top.against);

  return (
    <div className="space-y-6">
      <Reported reported={p.reported} />
      <section aria-labelledby="result-heading" className="rounded-lg border border-line bg-surface shadow-sm">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-muted">Most likely cause</p>
            <ConfidenceBadge confidence={top.confidence} />
          </div>
          <h2 id="result-heading" ref={heading} tabIndex={-1} className="text-[22px] leading-snug font-semibold outline-none sm:text-2xl">
            {top.outcome.title}
          </h2>
          <p className="text-[16px] leading-relaxed">{top.outcome.summary}</p>
          <p className="text-sm text-muted">{CONFIDENCE[top.confidence].description}</p>

          <div>
            <h3 className="font-semibold">Why this matches</h3>
            <ul className="mt-2 space-y-1.5 text-[15px]">
              {supporting.map((r) => (
                <li key={r} className="flex gap-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {against.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-muted">What counts against it</summary>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted">
                  {against.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div>
            <h3 className="font-semibold">What is going on</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed">{top.outcome.explanation}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-line p-4 sm:p-6">
          <SafetyNotices ids={p.evaluation.safety} notices={p.safetyNotices} />
          <div>
            <h3 className="font-semibold">Recommended checks</h3>
            <p className="mt-0.5 text-sm text-ink/70">General troubleshooting advice{p.printer ? ", matched to your printer's recorded hardware" : ""}.</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed">
              {applicableChecks(top.outcome.checks, p.evaluation.facts).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </div>
          <SlicerSettingsPanel settingKeys={top.outcome.slicerSettings} slicers={p.slicers} printers={p.printers} printerSlug={p.printerSlug} />
          {top.outcome.escalation && <Notice title="If this does not solve it">{top.outcome.escalation}</Notice>}
          <PrinterBasis printerName={p.printerName} printerSlug={p.printerSlug} specs={specsUsed} />
        </div>

        {topGuide && steps.length > 0 && (
          <div className="space-y-4 border-t border-line p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold">How to fix it</h3>
              <p className="mt-0.5 text-sm text-ink/70">
                From the guide &ldquo;{topGuide.title}&rdquo;.{" "}
                {p.printer ? "Steps that do not apply to your printer's hardware are left out." : "Steps that depend on hardware are labelled."}
              </p>
            </div>
            {(topGuide.tools.length > 0 || topGuide.parts.length > 0) && (
              <div className="rounded-md bg-page p-3 text-sm">
                <p className="font-medium">You may need</p>
                <p className="mt-0.5 text-ink/80">{[...topGuide.tools, ...topGuide.parts.map((x) => `${x.name}${x.optional ? " (only if needed)" : ""}`)].join(" · ")}</p>
              </div>
            )}
            <SafetyNotices ids={topGuide.safety.filter((s) => !p.evaluation.safety.includes(s))} notices={p.safetyNotices} />
            <ol className="space-y-5">
              {steps.map(({ step, conditional }, i) => (
                <TroubleshootingStep key={step.id} step={step} number={i + 1} conditional={conditional} assets={p.assets} />
              ))}
            </ol>
            <div className="rounded-md border border-line p-3 text-sm">
              <p className="font-medium">Check whether it worked</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {topGuide.verificationSteps.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-4 border-t border-line bg-page/60 p-4 sm:p-6">
          {topGuides.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <LinkButton href={guideHref(topGuides[0]!.slug, p.flow.id, top.outcome.id, p.printerSlug)} size="lg">
                {steps.length > 0 ? "Open the step-by-step guide" : "Start repair guide"}
                <ArrowRight aria-hidden />
              </LinkButton>
              {topGuides.slice(1).map((g) => (
                <LinkButton key={g.slug} href={guideHref(g.slug, p.flow.id, top.outcome.id, p.printerSlug)} variant="secondary" size="lg">
                  {g.title}
                </LinkButton>
              ))}
            </div>
          )}
          {topGuides[0] && <p className="text-sm text-muted">Guide: {topGuides[0].title}. {topGuides[0].summary}</p>}

          {p.fixed ? (
            <Notice tone="success" title="Glad it is working again.">
              The result has been noted on this device. You can close this page, or go back to your answers if the problem returns.
            </Notice>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">After working through the checks:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={p.onFixed}>
                  <CircleCheck className="text-success" aria-hidden />
                  This fixed it
                </Button>
                <Button variant="secondary" onClick={() => p.onNotFixed(top.outcome.id)}>
                  Still not fixed: show the next cause
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="others-heading">
          <h2 id="others-heading" className="text-lg font-semibold">
            Other possible causes
          </h2>
          <p className="mt-1 text-sm text-muted">Ranked by how well they fit your answers.</p>
          <ul className="mt-3 space-y-2">
            {others.map((r) => (
              <li key={r.outcome.id}>
                <details className="group rounded-lg border border-line bg-surface">
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{r.outcome.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{r.outcome.summary}</span>
                    </span>
                    <ConfidenceBadge confidence={r.confidence} className="shrink-0" />
                    <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-3 border-t border-line p-4 text-[15px]">
                    <p className="leading-relaxed">{r.outcome.explanation}</p>
                    <ul className="space-y-1 text-sm text-muted">
                      {reasons(r.supporting).map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                    <div>
                      <h3 className="text-sm font-semibold">Checks</h3>
                      <ol className="mt-1 list-decimal space-y-1 pl-5">
                        {applicableChecks(r.outcome.checks, p.evaluation.facts).map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ol>
                    </div>
                    <SlicerSettingsPanel settingKeys={r.outcome.slicerSettings} slicers={p.slicers} printers={p.printers} printerSlug={p.printerSlug} />
                    {r.outcome.escalation && <p className="text-sm text-muted">{r.outcome.escalation}</p>}
                    <SafetyNotices ids={r.outcome.safety} notices={p.safetyNotices} />
                    {guidesFor(r).length > 0 && (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {guidesFor(r).map((g) => (
                          <li key={g.slug}>
                            <Link href={guideHref(g.slug, p.flow.id, r.outcome.id, p.printerSlug)}>{g.title}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TriedList tried={p.evaluation.tried} onUntry={p.onUntry} />

      <section aria-labelledby="about-result" className="space-y-3 text-sm text-muted">
        <h2 id="about-result" className="sr-only">
          About this result
        </h2>
        <p>
          Confidence labels come from fixed rules applied to your answers. They are not statistical probabilities.{" "}
          {p.flow.verification.lastReviewed
            ? `This diagnosis (version ${p.flow.version}) was last reviewed on ${p.flow.verification.lastReviewed}.`
            : `This diagnosis (version ${p.flow.version}) has not yet been reviewed by a second person, so treat it as a guide and check against your printer's documentation.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={p.onReviewAnswers}>
            Review my answers
          </Button>
          <Button variant="ghost" size="sm" onClick={p.onRestart}>
            <RotateCcw aria-hidden />
            Start again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setReporting((r) => !r)} aria-expanded={reporting}>
            <Flag aria-hidden />
            This diagnosis looks wrong
          </Button>
        </div>
        {reporting && (
          <div className="rounded-lg border border-line bg-surface p-4 text-ink">
            <FeedbackForm
              kind="incorrect-diagnosis"
              label="What was wrong with this diagnosis?"
              hint="Your answers and the suggested causes are included with the report. Nothing else about you is sent."
              context={p.feedbackContext}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function TriedList({ tried, onUntry }: { tried: RankedOutcome[]; onUntry: (id: string) => void }) {
  if (tried.length === 0) return null;
  return (
    <section aria-labelledby="tried-heading" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="tried-heading" className="font-semibold">
        Already tried
      </h2>
      <ul className="mt-2 divide-y divide-line">
        {tried.map((t) => (
          <li key={t.outcome.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-muted line-through decoration-muted/60">{t.outcome.title}</span>
            <button type="button" onClick={() => onUntry(t.outcome.id)} className="inline-flex shrink-0 items-center gap-1 font-medium text-primary-dark hover:underline">
              <Undo2 className="size-3.5" aria-hidden />
              Undo
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The problem the person picked and their own photo, side by side. Neither is treated as proof of the cause. */
function Reported({ reported }: { reported: { title: string; asset: VisualAsset | null } | null }) {
  const photo = useUploadedPhoto();
  if (!reported && !photo) return null;
  return (
    <section aria-labelledby="reported-heading" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="reported-heading" className="font-semibold">
        What you reported
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {reported && (
          <div>
            <SymptomImage asset={reported.asset} credit eager />
            <p className="mt-1 text-[15px] font-medium">{reported.title}</p>
          </div>
        )}
        {photo && (
          <figure>
            {/* A local photo the person chose; nothing to optimise. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt="Your photo of the print" className="aspect-[4/3] w-full rounded-md border border-line object-cover" />
            <figcaption className="mt-1 text-[15px] font-medium">
              Your photo <span className="text-sm font-normal text-ink/70">(not analysed)</span>
            </figcaption>
          </figure>
        )}
      </div>
      <p className="mt-3 text-sm text-ink/70">
        The example picture shows what this kind of problem looks like. Neither picture proves what caused it on your printer: the causes below come from your
        answers.
      </p>
    </section>
  );
}

/** Separates confirmed printer specifications from general advice. */
function PrinterBasis({ printerName, printerSlug, specs }: { printerName: string | null; printerSlug: string | null; specs: { label: string; value: string }[] }) {
  if (!printerName || !printerSlug) {
    return (
      <Notice title="These instructions are general">
        Choose your printer above to leave out steps that do not apply to its hardware, such as manual levelling on a printer that levels itself.
      </Notice>
    );
  }
  return (
    <div className="rounded-md border border-line p-3 text-sm">
      <p className="font-medium">Confirmed specifications used for the {printerName}</p>
      {specs.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {specs.map((s) => (
            <li key={s.label}>
              <span className="text-ink/70">{s.label}:</span> {s.value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-ink/70">None of the specifications this diagnosis uses are recorded for this printer yet, so the advice is general.</p>
      )}
      <p className="mt-1.5">
        <Link href={`/printers/${printerSlug}`}>Where these figures come from</Link>
      </p>
    </div>
  );
}
