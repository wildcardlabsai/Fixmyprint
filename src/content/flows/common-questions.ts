import type { DiagnosticFlowInput } from "@/lib/schema";

type QuestionInput = DiagnosticFlowInput["questions"][number];

/**
 * Questions reused across flows. Flows override `next` (and evidence where needed)
 * so each flow keeps its own branching.
 */
export const levellingQuestion: QuestionInput = {
  id: "levelling",
  prompt: "How does your printer set the nozzle height?",
  why: "The fix is different for manual knobs, a separate probe and a nozzle that senses the bed itself.",
  help: "If you choose your printer, we can fill this in from its specifications.",
  autoAnswer: {
    fact: "printer.levelling",
    map: { manual: "manual", "probe-offset": "probe-offset", "nozzle-sensing": "nozzle-sensing" },
  },
  options: [
    { id: "manual", label: "Knobs or screws under the bed", detail: "Manual levelling, no sensor.", next: "result", facts: { "printer.levelling": "manual" } },
    { id: "probe-offset", label: "A separate probe beside the nozzle", detail: "For example BLTouch, CR Touch or an inductive probe such as SuperPINDA.", next: "result", facts: { "printer.levelling": "probe-offset" } },
    { id: "nozzle-sensing", label: "The nozzle touches the bed itself", detail: "Load cell, strain gauge or force sensing. Common on recent Bambu Lab, Prusa MK4 and Klipper machines.", next: "result", facts: { "printer.levelling": "nozzle-sensing" } },
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
