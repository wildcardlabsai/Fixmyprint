import { evaluateCondition, type Facts } from "@/lib/engine/conditions";
import type { Guide, GuideStep } from "@/lib/schema";

export interface VisibleStep {
  step: GuideStep;
  /** True when the step depends on hardware we do not know, so it is shown with its label. */
  conditional: boolean;
}

/**
 * Chooses which steps to show for the known hardware. Steps that definitely do
 * not apply are hidden; steps whose applicability is unknown are shown and
 * labelled, so nothing relevant is hidden from someone who has not said which
 * hardware they have.
 */
export function visibleSteps(guide: Guide, facts: Facts): VisibleStep[] {
  const out: VisibleStep[] = [];
  for (const step of guide.steps) {
    if (!step.appliesWhen) {
      out.push({ step, conditional: false });
      continue;
    }
    const r = evaluateCondition(step.appliesWhen, { facts, answers: {} });
    if (r === true) out.push({ step, conditional: false });
    else if (r === "unknown") out.push({ step, conditional: true });
  }
  return out;
}
