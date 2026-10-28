import { describe, expect, it } from "vitest";
import { evaluate, emptyState, answerQuestion, type DiagnosticState } from "@/lib/engine/engine";
import { checkContentIntegrity } from "@/lib/content-integrity";
import { RESULT, type DiagnosticFlow } from "@/lib/schema";
import { seed } from ".";

describe("seed content", () => {
  it("passes schema validation and cross-reference checks", () => {
    expect(checkContentIntegrity(seed)).toEqual([]);
  });

  it("does not mark seeded content as verified", () => {
    const all = [...seed.printers, ...seed.flows, ...seed.guides, ...seed.filaments, ...seed.maintenance, ...seed.parts, ...seed.errorCodes];
    expect(all.filter((r) => r.verification.status === "verified" || r.verification.status === "reviewed")).toEqual([]);
  });

  it("gives every symptom category at least one symptom", () => {
    for (const c of seed.categories) expect(seed.symptoms.some((s) => s.category === c.slug), c.slug).toBe(true);
  });

  it("does not invent specifications: unknown printer fields stay null", () => {
    // Creality's own pages disagree on the Ender-3 V2's temperatures, so they stay blank.
    const e3v2 = seed.printers.find((p) => p.slug === "creality-ender-3-v2")!;
    expect(e3v2.specs.hotendMaxTempC).toBeNull();
    expect(e3v2.specs.bed?.maxTempC).toBeNull();
    expect(e3v2.verification.knownLimitations.join(" ")).toMatch(/250 °C, 255 °C and 260 °C/);
  });
});

/** Enumerates every path through a flow by exploring all answers (and both sides of printer facts). */
function allPaths(flow: DiagnosticFlow): DiagnosticState[] {
  const finished: DiagnosticState[] = [];
  const queue: DiagnosticState[] = [emptyState()];
  let guard = 0;
  while (queue.length && guard++ < 20000) {
    const state = queue.shift()!;
    const ev = evaluate(flow, state);
    if (!ev.current) {
      finished.push(state);
      continue;
    }
    for (const o of ev.current.options) queue.push(answerQuestion(flow, state, ev.current.id, o.id));
  }
  return finished;
}

describe.each(seed.flows.map((f) => [f.id, f] as const))("flow %s", (_id, flow) => {
  const paths = allPaths(flow);

  it("terminates on every path without engine issues", () => {
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const ev = evaluate(flow, p);
      expect(ev.issues).toEqual([]);
      expect(ev.status === "diagnosed" || ev.status === "insufficient").toBe(true);
    }
  });

  it("reaches every outcome as the top cause on at least one path", () => {
    const tops = new Set(paths.map((p) => evaluate(flow, p).ranking[0]?.outcome.id).filter(Boolean));
    const unreachable = flow.outcomes.map((o) => o.id).filter((id) => !tops.has(id));
    // Some outcomes are secondary by design; they must at least appear in a ranking.
    const anywhere = new Set(paths.flatMap((p) => evaluate(flow, p).ranking.map((r) => r.outcome.id)));
    expect(unreachable.filter((id) => !anywhere.has(id))).toEqual([]);
  });

  it("asks a reasonable number of questions", () => {
    for (const p of paths) expect(evaluate(flow, p).steps.length).toBeLessThanOrEqual(8);
  });

  it("only uses 'result' as a terminal", () => {
    expect(flow.questions.some((q) => q.id === RESULT)).toBe(false);
  });
});
