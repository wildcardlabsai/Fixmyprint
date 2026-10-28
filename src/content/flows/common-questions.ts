import type { Condition, DiagnosticFlowInput } from "@/lib/schema";

/** Hardware conditions for advice that only applies to some levelling systems. */
export const levelling = {
  manual: { fact: "printer.levelling", in: ["manual"] } as Condition,
  /** A Z offset the user sets: separate probes, and automatic systems that may expose one. */
  adjustableOffset: { fact: "printer.levelling", in: ["probe-offset", "automatic"] } as Condition,
  nozzleSensing: { fact: "printer.levelling", in: ["nozzle-sensing"] } as Condition,
  selfLevelling: { fact: "printer.levelling", in: ["probe-offset", "nozzle-sensing", "automatic"] } as Condition,
  automatic: { fact: "printer.levelling", in: ["automatic"] } as Condition,
};

type QuestionInput = DiagnosticFlowInput["questions"][number];

/**
 * Questions reused across flows. Flows override `next` (and evidence where needed)
 * so each flow keeps its own branching.
 */
export const levellingQuestion: QuestionInput = {
  id: "levelling",
  prompt: "How does your printer set the nozzle height?",
  why: "The fix is different for manual knobs, a separate probe, and printers that level themselves.",
  help: "If you choose your printer, we can fill this in from its specifications.",
  autoAnswer: {
    fact: "printer.levelling",
    map: { manual: "manual", "probe-offset": "probe-offset", "nozzle-sensing": "nozzle-sensing", automatic: "automatic" },
  },
  options: [
    { id: "manual", label: "Knobs or screws under the bed", detail: "Manual levelling, no sensor.", next: "result", facts: { "printer.levelling": "manual" } },
    { id: "probe-offset", label: "A separate probe beside the nozzle", detail: "For example BLTouch, CR Touch or an inductive probe such as SuperPINDA.", next: "result", facts: { "printer.levelling": "probe-offset" } },
    { id: "nozzle-sensing", label: "The nozzle touches the bed itself", detail: "Load cell, strain gauge or force sensing. Common on recent Bambu Lab, Prusa MK4 and Klipper machines.", next: "result", facts: { "printer.levelling": "nozzle-sensing" } },
    { id: "automatic", label: "It levels itself, but I'm not sure how", detail: "It runs a levelling routine on its own before or during printing.", next: "result", facts: { "printer.levelling": "automatic" } },
    { id: "unsure", label: "I'm not sure", next: "result", uncertain: true },
  ],
};

export const materialQuestion: QuestionInput = {
  id: "material",
  prompt: "Which material are you printing with?",
  why: "Materials need different temperatures and behave differently as they cool, so the likely causes change.",
  options: [
    { id: "pla", label: "PLA", next: "result", facts: { filament: "pla" } },
    { id: "petg", label: "PETG", next: "result", facts: { filament: "petg" } },
    { id: "abs-asa", label: "ABS or ASA", next: "result", facts: { filament: "abs-asa" } },
    { id: "tpu", label: "TPU or another flexible", next: "result", facts: { filament: "tpu" } },
    { id: "nylon-pc", label: "Nylon or polycarbonate", next: "result", facts: { filament: "nylon-pc" } },
    { id: "composite", label: "Carbon or glass-fibre filled", next: "result", facts: { filament: "composite" } },
    { id: "other", label: "Something else or not sure", next: "result", uncertain: true },
  ],
};

/** Re-targets every option of a shared question to the same next step. */
export function withNext(q: QuestionInput, next: QuestionInput["options"][number]["next"]): QuestionInput {
  return { ...q, options: q.options.map((o) => ({ ...o, next })) };
}
