import { describe, expect, it } from "vitest";
import { applicableChecks, evaluateCondition, factsFromPrinter, type Facts } from "@/lib/engine/conditions";
import { answerQuestion, emptyState, evaluate, type DiagnosticState } from "@/lib/engine/engine";
import { visibleSteps } from "@/lib/guide-steps";
import type { DiagnosticFlow } from "@/lib/schema";
import { seed } from ".";

/** Every finished path through a flow for a given printer. */
function finishedPaths(flow: DiagnosticFlow, facts: Facts): DiagnosticState[] {
  const done: DiagnosticState[] = [];
  const queue = [emptyState()];
  while (queue.length) {
    const state = queue.shift()!;
    const ev = evaluate(flow, state, facts);
    if (!ev.current) done.push(state);
    else for (const o of ev.current.options) queue.push(answerQuestion(flow, state, ev.current.id, o.id, facts));
  }
  return done;
}

/** Bed-levelling outcomes that only make sense for knob-levelled beds. */
const MANUAL_ONLY_OUTCOMES = ["manual-temperature", "manual-drift", "loose-hardware"];
const guide = (slug: string) => seed.guides.find((g) => g.slug === slug)!;
const fits = (slug: string, facts: Facts) => {
  const g = guide(slug);
  return !g.appliesWhen || evaluateCondition(g.appliesWhen, { facts, answers: {} }) !== false;
};

const selfLevelling = seed.printers.filter((p) => p.specs.levelling && p.specs.levelling !== "manual");
const manual = seed.printers.filter((p) => p.specs.levelling === "manual");

describe("levelling advice matches the printer's hardware", () => {
  it("has printers of every levelling type to test against", () => {
    for (const type of ["manual", "probe-offset", "nozzle-sensing", "automatic"]) {
      expect(seed.printers.some((p) => p.specs.levelling === type), type).toBe(true);
    }
  });

  it.each(selfLevelling.map((p) => [p.slug, p] as const))("never gives manual-levelling advice for %s", (_slug, printer) => {
    const facts = factsFromPrinter(printer);
    for (const flow of seed.flows) {
      for (const state of finishedPaths(flow, facts)) {
        const ev = evaluate(flow, state, facts);
        expect(ev.steps.some((s) => s.question.id === "manual-method"), `${flow.id} asks how the bed is levelled manually`).toBe(false);
        for (const r of [...ev.ranking, ...ev.tried]) {
          if (flow.id === "bed-levelling-and-probe") {
            expect(MANUAL_ONLY_OUTCOMES, `${flow.id} suggests ${r.outcome.id}`).not.toContain(r.outcome.id);
          }
          for (const check of applicableChecks(r.outcome.checks, ev.facts)) {
            expect(check, `${flow.id}/${r.outcome.id}`).not.toMatch(/^Manual|knob/i);
          }
        }
      }
    }
    const steps = visibleSteps(guide("level-the-bed"), facts).map((s) => s.step.appliesLabel);
    expect(steps).not.toContain("Manual beds");
  });

  it.each(manual.map((p) => [p.slug, p] as const))("never gives probe or nozzle-sensing advice for %s", (_slug, printer) => {
    const facts = factsFromPrinter(printer);
    expect(fits("set-the-z-offset", facts)).toBe(false);
    for (const flow of seed.flows) {
      for (const state of finishedPaths(flow, facts)) {
        const ev = evaluate(flow, state, facts);
        for (const r of ev.ranking) {
          for (const check of applicableChecks(r.outcome.checks, ev.facts)) {
            expect(check, `${flow.id}/${r.outcome.id}`).not.toMatch(/^(Separate probe|Nozzle-sensing|Printers that level themselves|Raise the Z offset|Raise the nozzle in small steps)/);
          }
        }
      }
    }
    const labels = visibleSteps(guide("level-the-bed"), facts).map((s) => s.step.appliesLabel).filter(Boolean);
    expect(new Set(labels)).toEqual(new Set(["Manual beds"]));
  });

  it("does not offer the Z offset guide where the nozzle senses the bed", () => {
    for (const p of seed.printers.filter((x) => x.specs.levelling === "nozzle-sensing")) {
      expect(fits("set-the-z-offset", factsFromPrinter(p)), p.slug).toBe(false);
    }
  });

  it("offers the Z offset guide for separate probes and keeps it available when the printer is unknown", () => {
    for (const p of seed.printers.filter((x) => x.specs.levelling === "probe-offset")) {
      expect(fits("set-the-z-offset", factsFromPrinter(p)), p.slug).toBe(true);
    }
    expect(fits("set-the-z-offset", {})).toBe(true);
  });
});

describe("printer records", () => {
  it("cite at least one manufacturer page for their specifications", () => {
    for (const p of seed.printers) expect(p.specSources.length, p.slug).toBeGreaterThan(0);
  });

  it("covers the main manufacturers", () => {
    const makers = new Set(seed.printers.map((p) => p.manufacturer));
    for (const m of ["bambu-lab", "prusa-research", "creality", "anycubic", "elegoo", "qidi-tech", "sovol", "flashforge", "artillery", "raise3d", "ultimaker"]) {
      expect(makers.has(m), m).toBe(true);
    }
  });
});
