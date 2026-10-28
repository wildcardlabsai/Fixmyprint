import type { Condition, FactKey } from "@/lib/schema/condition";
import type { PrinterModel } from "@/lib/schema/printer";

export type Facts = Partial<Record<FactKey, string>>;

/** Three-valued result: a condition can be definitely true, definitely false, or unknown. */
export type Tri = true | false | "unknown";

export interface ConditionContext {
  facts: Facts;
  /** Answers on the current path only, keyed by question id. */
  answers: Record<string, string>;
}

/**
 * Evaluates a condition using Kleene three-valued logic. A fact or answer that
 * has not been established evaluates to "unknown" rather than false, so callers
 * decide whether unknown should include or exclude something.
 */
export function evaluateCondition(condition: Condition, ctx: ConditionContext): Tri {
  if ("all" in condition) {
    let sawUnknown = false;
    for (const c of condition.all) {
      const r = evaluateCondition(c, ctx);
      if (r === false) return false;
      if (r === "unknown") sawUnknown = true;
    }
    return sawUnknown ? "unknown" : true;
  }
  if ("any" in condition) {
    let sawUnknown = false;
    for (const c of condition.any) {
      const r = evaluateCondition(c, ctx);
      if (r === true) return true;
      if (r === "unknown") sawUnknown = true;
    }
    return sawUnknown ? "unknown" : false;
  }
  if ("not" in condition) {
    const r = evaluateCondition(condition.not, ctx);
    return r === "unknown" ? "unknown" : !r;
  }
  if ("fact" in condition) {
    const value = ctx.facts[condition.fact];
    if (value === undefined) return "unknown";
    return condition.in.includes(value);
  }
  const value = ctx.answers[condition.answer];
  if (value === undefined) return "unknown";
  return condition.in.includes(value);
}

export const isTrue = (c: Condition | undefined, ctx: ConditionContext) =>
  c !== undefined && evaluateCondition(c, ctx) === true;

/** Derives rules-engine facts from a printer record. Unknown specifications produce no fact. */
export function factsFromPrinter(printer: PrinterModel | null | undefined): Facts {
  if (!printer) return {};
  const s = printer.specs;
  const facts: Facts = { "printer.selected": "yes" };
  if (s.levelling) facts["printer.levelling"] = s.levelling;
  if (s.extruder) facts["printer.extruder"] = s.extruder;
  if (s.enclosure) facts["printer.enclosure"] = s.enclosure;
  if (s.motionSystem) facts["printer.motion"] = s.motionSystem;
  if (s.firmwareFamily) facts["printer.firmware"] = s.firmwareFamily;
  if (s.linearMotion) facts["printer.linearMotion"] = s.linearMotion;
  if (s.bed?.surfaceKind) facts["printer.bedSurface"] = s.bed.surfaceKind;
  // Only a built-in system is a certain fact. An optional add-on may or may not be
  // fitted, and an empty list means none has been recorded, not that none exists.
  if (s.multiMaterial.some((m) => m.kind === "built-in")) facts["printer.multiMaterial"] = "yes";
  return facts;
}

/** Checks that apply to the known hardware. Unknown hardware keeps every check. */
export function applicableChecks(checks: (string | { text: string; when: Condition })[], facts: Facts): string[] {
  return checks
    .filter((c) => typeof c === "string" || evaluateCondition(c.when, { facts, answers: {} }) !== false)
    .map((c) => (typeof c === "string" ? c : c.text));
}
