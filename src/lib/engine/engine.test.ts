import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { diagnosticFlowSchema, type DiagnosticFlow } from "@/lib/schema";
import { applicableChecks, evaluateCondition, factsFromPrinter } from "./conditions";
import { answerQuestion, emptyState, evaluate, goBack, markTried, pruneToPath, type DiagnosticState } from "./engine";

const flow = (id: string) => {
  const f = seed.flows.find((x) => x.id === id);
  if (!f) throw new Error(`missing flow ${id}`);
  return f;
};
const printer = (slug: string) => seed.printers.find((p) => p.slug === slug)!;

/** Answers questions in order, asserting each one is the current question. */
function walk(f: DiagnosticFlow, pairs: [string, string][], facts = {}): DiagnosticState {
  let state = emptyState();
  for (const [q, o] of pairs) {
    const ev = evaluate(f, state, facts);
    expect(ev.current?.id, `expected to be asked "${q}"`).toBe(q);
    state = answerQuestion(f, state, q, o, facts);
  }
  return state;
}

describe("conditions", () => {
  const ctx = { facts: { "printer.levelling": "manual" as const }, answers: { a: "x" } };
  it("uses three-valued logic for unknown facts", () => {
    expect(evaluateCondition({ fact: "printer.extruder", in: ["bowden"] }, ctx)).toBe("unknown");
    expect(evaluateCondition({ not: { fact: "printer.extruder", in: ["bowden"] } }, ctx)).toBe("unknown");
    expect(evaluateCondition({ any: [{ fact: "printer.extruder", in: ["bowden"] }, { answer: "a", in: ["x"] }] }, ctx)).toBe(true);
    expect(evaluateCondition({ all: [{ fact: "printer.extruder", in: ["bowden"] }, { answer: "a", in: ["y"] }] }, ctx)).toBe(false);
    expect(evaluateCondition({ all: [{ fact: "printer.levelling", in: ["manual"] }, { answer: "a", in: ["x"] }] }, ctx)).toBe(true);
  });

  it("derives facts only from known specifications", () => {
    const facts = factsFromPrinter(printer("creality-ender-3-v2"));
    expect(facts["printer.levelling"]).toBe("manual");
    expect(facts["printer.extruder"]).toBeUndefined();
    expect(factsFromPrinter(printer("elegoo-neptune-4-pro"))["printer.extruder"]).toBe("direct");
    expect(factsFromPrinter(null)).toEqual({});
  });

  it("filters hardware-specific checks to the printer, keeping all when hardware is unknown", () => {
    const outcome = seed.flows.find((f) => f.id === "first-layer-adhesion")!.outcomes.find((o) => o.id === "nozzle-too-far")!;
    const mk4 = applicableChecks(outcome.checks, factsFromPrinter(printer("prusa-mk4")));
    expect(mk4.some((c) => c.startsWith("Manual levelling"))).toBe(false);
    expect(mk4.some((c) => c.startsWith("Separate probe"))).toBe(false);
    expect(mk4.some((c) => c.startsWith("Nozzle-sensing"))).toBe(true);
    expect(applicableChecks(outcome.checks, {})).toHaveLength(outcome.checks.length);
  });

  it("never treats an unrecorded multi-material system as absent", () => {
    for (const p of seed.printers) {
      const builtIn = p.specs.multiMaterial.some((m) => m.kind === "built-in");
      expect(factsFromPrinter(p)["printer.multiMaterial"], p.slug).toBe(builtIn ? "yes" : undefined);
    }
  });
});

describe("diagnostic engine: first layer flow", () => {
  const f = flow("first-layer-adhesion");

  it("starts at the first question with nothing answered", () => {
    const ev = evaluate(f, emptyState());
    expect(ev.current?.id).toBe("what-happens");
    expect(ev.status).toBe("in-progress");
    expect(ev.steps).toHaveLength(0);
    expect(ev.remaining).toBeGreaterThan(1);
  });

  it("branches to different questions depending on the answer", () => {
    const dragged = evaluate(f, { answers: { "what-happens": "dragged" }, tried: [] });
    const lifting = evaluate(f, { answers: { "what-happens": "corners-lift" }, tried: [] });
    const thin = evaluate(f, { answers: { "what-happens": "thin" }, tried: [] });
    expect(dragged.current?.id).toBe("line-shape");
    expect(lifting.current?.id).toBe("surface-clean");
    expect(thin.current?.id).toBe("thin-detail");
  });

  it("ranks the nozzle being too far first for round, dragged lines on a clean bed", () => {
    const state = walk(f, [
      ["what-happens", "dragged"],
      ["line-shape", "round"],
      ["levelling", "manual"],
      ["surface-clean", "washed"],
      ["material", "pla"],
      ["bed-temp", "in-range"],
    ]);
    const ev = evaluate(f, state);
    expect(ev.status).toBe("diagnosed");
    expect(ev.ranking[0]?.outcome.id).toBe("nozzle-too-far");
    expect(ev.ranking[0]?.confidence).toBe("strong");
    expect(ev.ranking.map((r) => r.outcome.id)).not.toContain("nozzle-too-close");
    expect(ev.ranking[0]?.supporting.length).toBeGreaterThan(0);
  });

  it("ranks contamination first when lines are flat but the surface has not been washed", () => {
    const state = walk(f, [
      ["what-happens", "dragged"],
      ["line-shape", "flat"],
      ["levelling", "probe-offset"],
      ["surface-clean", "not-really"],
      ["material", "petg"],
      ["bed-temp", "in-range"],
    ]);
    expect(evaluate(f, state).ranking[0]?.outcome.id).toBe("dirty-surface");
  });

  it("presents several plausible causes rather than a single certain one when evidence is mixed", () => {
    const state = walk(f, [
      ["what-happens", "corners-lift"],
      ["surface-clean", "unsure"],
      ["material", "abs-asa"],
      ["lift-when", "early"],
      ["environment", "open-draft"],
      ["bed-temp", "unsure"],
    ]);
    const ev = evaluate(f, state);
    const ids = ev.ranking.map((r) => r.outcome.id);
    expect(ids).toEqual(expect.arrayContaining(["drafts", "thermal-contraction"]));
    expect(ev.ranking.length).toBeGreaterThan(1);
  });

  it("applies printer-specific rules", () => {
    const answers: [string, string][] = [
      ["what-happens", "corners-lift"],
      ["surface-clean", "washed"],
      ["material", "abs-asa"],
      ["lift-when", "later"],
    ];
    const open = factsFromPrinter(printer("bambu-lab-a1-mini"));
    const stateOpen = walk(f, answers, open);
    // The open-frame printer still needs the environment question answered.
    const evOpen = evaluate(f, answerQuestion(f, stateOpen, "environment", "open-still", open), open);
    const contraction = evOpen.ranking.find((r) => r.outcome.id === "thermal-contraction")!;
    expect(contraction.supporting.some((c) => c.kind === "rule")).toBe(true);
  });

  it("skips a question the selected printer already answers, and records where the answer came from", () => {
    const facts = factsFromPrinter(printer("prusa-mk4"));
    const state = walk(f, [["what-happens", "dragged"], ["line-shape", "round"]], facts);
    const ev = evaluate(f, state, facts);
    expect(ev.current?.id).toBe("surface-clean");
    const levelling = ev.steps.find((s) => s.question.id === "levelling");
    expect(levelling?.source).toBe("printer");
    expect(levelling?.option.id).toBe("nozzle-sensing");
  });

  it("auto-answers the enclosure question for an enclosed printer", () => {
    const facts = factsFromPrinter(printer("bambu-lab-p1s"));
    const state = walk(f, [
      ["what-happens", "corners-lift"],
      ["surface-clean", "washed"],
      ["material", "abs-asa"],
      ["lift-when", "later"],
    ], facts);
    const ev = evaluate(f, state, facts);
    expect(ev.current?.id).toBe("bed-temp");
    expect(ev.steps.find((s) => s.question.id === "environment")?.source).toBe("printer");
  });

  it("lets the user override a printer-derived answer", () => {
    const facts = factsFromPrinter(printer("creality-ender-3-v2")); // manual levelling as standard
    let state = walk(f, [["what-happens", "dragged"], ["line-shape", "round"]], facts);
    state = answerQuestion(f, state, "levelling", "probe-offset", facts); // fitted an aftermarket probe
    const ev = evaluate(f, state, facts);
    const levelling = ev.steps.find((s) => s.question.id === "levelling");
    expect(levelling?.source).toBe("user");
    expect(ev.facts["printer.levelling"]).toBe("probe-offset");
  });

  it("clears later answers when an earlier answer is changed", () => {
    let state = walk(f, [
      ["what-happens", "dragged"],
      ["line-shape", "round"],
      ["levelling", "manual"],
    ]);
    state = answerQuestion(f, state, "what-happens", "patchy");
    expect(Object.keys(state.answers)).toEqual(["what-happens"]);
    const ev = evaluate(f, state);
    expect(ev.current?.id).toBe("pattern");
  });

  it("goes back one answer at a time", () => {
    let state = walk(f, [["what-happens", "dragged"], ["line-shape", "round"]]);
    state = goBack(f, state);
    expect(evaluate(f, state).current?.id).toBe("line-shape");
    state = goBack(f, state);
    expect(evaluate(f, state).current?.id).toBe("what-happens");
    expect(goBack(f, state)).toEqual(state);
  });

  it("goes back past printer-derived answers to the last user answer", () => {
    const facts = factsFromPrinter(printer("prusa-mk4"));
    let state = walk(f, [["what-happens", "dragged"], ["line-shape", "round"]], facts);
    state = goBack(f, state, facts);
    expect(evaluate(f, state, facts).current?.id).toBe("line-shape");
  });

  it("rejects an answer that does not belong to the question", () => {
    expect(() => answerQuestion(f, emptyState(), "what-happens", "nonsense")).toThrow(/Invalid answer/);
    expect(() => answerQuestion(f, emptyState(), "no-such-question", "x")).toThrow(/Invalid answer/);
  });

  it("reports stored answers that are no longer valid and asks the question again", () => {
    const ev = evaluate(f, { answers: { "what-happens": "removed-option" }, tried: [] });
    expect(ev.current?.id).toBe("what-happens");
    expect(ev.issues).toContainEqual({ kind: "invalid-answer", questionId: "what-happens", optionId: "removed-option" });
  });

  it("ignores answers that are not on the current path", () => {
    const state: DiagnosticState = { answers: { "what-happens": "thin", pattern: "one-side" }, tried: [] };
    const ev = evaluate(f, state);
    expect(ev.steps.map((s) => s.question.id)).toEqual(["what-happens"]);
    expect(pruneToPath(f, state).answers).toEqual({ "what-happens": "thin" });
  });

  it("moves on to the next cause when the first one did not fix it", () => {
    const state = walk(f, [
      ["what-happens", "dragged"],
      ["line-shape", "flat"],
      ["levelling", "manual"],
      ["surface-clean", "not-really"],
      ["material", "pla"],
      ["bed-temp", "low"],
    ]);
    const first = evaluate(f, state);
    const top = first.ranking[0]!.outcome.id;
    const after = evaluate(f, markTried(state, top));
    expect(after.ranking[0]?.outcome.id).not.toBe(top);
    expect(after.tried.map((t) => t.outcome.id)).toContain(top);
    expect(markTried(markTried(state, top), top).tried).toEqual([top]);
  });

  it("reports insufficient information when every plausible cause has been tried", () => {
    const state = walk(f, [
      ["what-happens", "inconsistent"],
      ["extrude-test", "nothing"],
    ]);
    let s = state;
    for (const r of evaluate(f, state).ranking) s = markTried(s, r.outcome.id);
    const ev = evaluate(f, s);
    expect(ev.ranking).toHaveLength(0);
    expect(ev.status).toBe("insufficient");
  });

  it("excludes outcomes that cannot apply to the selected printer", () => {
    const glassBed = factsFromPrinter(printer("creality-ender-3-v2"));
    const state = walk(f, [
      ["what-happens", "patchy"],
      ["pattern", "same-spot"],
      ["surface-clean", "worn"],
    ], glassBed);
    const ev = evaluate(f, state, glassBed);
    expect(ev.ranking.map((r) => r.outcome.id)).not.toContain("worn-surface");
    expect(ev.excluded.map((o) => o.id)).toContain("worn-surface");
  });

  it("collects safety notices from the flow, the questions asked and the leading outcomes", () => {
    const state = walk(f, [["what-happens", "inconsistent"], ["extrude-test", "nothing"]]);
    const ev = evaluate(f, state);
    expect(ev.safety).toContain("hot-surfaces");
  });

  it("is deterministic", () => {
    const state = walk(f, [["what-happens", "patchy"], ["pattern", "random"], ["levelling", "unsure"], ["surface-clean", "unsure"]]);
    const a = evaluate(f, state);
    const b = evaluate(f, state);
    expect(a.ranking.map((r) => [r.outcome.id, r.score])).toEqual(b.ranking.map((r) => [r.outcome.id, r.score]));
  });
});

describe("diagnostic engine: structural safety", () => {
  const base = diagnosticFlowSchema.parse({
    id: "loop",
    version: 1,
    title: "Loop",
    summary: "Test",
    category: "test",
    symptomSlugs: ["test"],
    start: "a",
    questions: [
      { id: "a", prompt: "A", why: "A", options: [{ id: "x", label: "X", next: "b", evidence: { o: 3 } }, { id: "y", label: "Y", next: "result" }] },
      { id: "b", prompt: "B", why: "B", options: [{ id: "x", label: "X", next: "a" }, { id: "y", label: "Y", next: "missing" }] },
    ],
    outcomes: [{ id: "o", title: "O", summary: "O", explanation: "O", checks: ["c"] }],
    insufficient: { title: "t", explanation: "e", checks: ["c"] },
    verification: { status: "draft", author: "test", reviewedBy: null, lastReviewed: null },
  });

  it("stops on a cycle instead of looping forever", () => {
    const ev = evaluate(base, { answers: { a: "x", b: "x" }, tried: [] });
    expect(ev.issues.some((i) => i.kind === "cycle")).toBe(true);
    expect(ev.status).toBe("in-progress");
  });

  it("stops on a missing question", () => {
    const ev = evaluate(base, { answers: { a: "x", b: "y" }, tried: [] });
    expect(ev.issues).toContainEqual({ kind: "missing-question", questionId: "missing" });
  });
});
