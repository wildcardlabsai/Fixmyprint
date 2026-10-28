import type { SafetyId } from "@/lib/schema/common";
import {
  RESULT,
  type AnswerOption,
  type DiagnosticFlow,
  type Next,
  type Outcome,
  type Question,
} from "@/lib/schema/diagnostic";
import { isTrue, type ConditionContext, type Facts } from "./conditions";

export interface DiagnosticState {
  /** User-chosen answers, keyed by question id. */
  answers: Record<string, string>;
  /** Outcomes the user has already tried to fix without success. */
  tried: string[];
}

export const emptyState = (): DiagnosticState => ({ answers: {}, tried: [] });

export interface PathStep {
  question: Question;
  option: AnswerOption;
  /** "printer" when the answer was filled in from the selected printer's specifications. */
  source: "user" | "printer";
}

export interface Contribution {
  outcomeId: string;
  weight: number;
  kind: "answer" | "rule";
  questionId?: string;
  prompt?: string;
  answerLabel?: string;
  reason?: string;
}

export type Confidence = "strong" | "likely" | "possible";

export interface RankedOutcome {
  outcome: Outcome;
  score: number;
  confidence: Confidence;
  supporting: Contribution[];
  against: Contribution[];
}

export type EngineIssue =
  | { kind: "invalid-answer"; questionId: string; optionId: string }
  | { kind: "missing-question"; questionId: string }
  | { kind: "cycle"; questionId: string }
  | { kind: "unknown-outcome"; outcomeId: string };

export interface Evaluation {
  steps: PathStep[];
  current: Question | null;
  /** Upper bound on questions still to answer, including the current one. */
  remaining: number;
  status: "in-progress" | "diagnosed" | "insufficient";
  ranking: RankedOutcome[];
  tried: RankedOutcome[];
  excluded: Outcome[];
  facts: Facts;
  safety: SafetyId[];
  issues: EngineIssue[];
}

/** Minimum score for an outcome to be presented as plausible. */
export const MIN_SCORE = 2;

export function confidenceFor(score: number, runnerUp: number | undefined): Confidence {
  if (score >= 6 && (runnerUp === undefined || score - runnerUp >= 3)) return "strong";
  if (score >= 4) return "likely";
  return "possible";
}

export function resolveNext(next: Next, ctx: ConditionContext): string {
  if (typeof next === "string") return next;
  for (const b of next.branch) if (isTrue(b.when, ctx)) return b.goto;
  return next.otherwise;
}

function questionMap(flow: DiagnosticFlow) {
  return new Map(flow.questions.map((q) => [q.id, q]));
}

/** Longest possible number of questions from `startId` to the result, ignoring conditions. */
function longestRemaining(flow: DiagnosticFlow, startId: string): number {
  const qs = questionMap(flow);
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (id === RESULT) return 0;
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const q = qs.get(id);
    if (!q || visiting.has(id)) return 0;
    visiting.add(id);
    let best = 0;
    for (const o of q.options) {
      const targets = typeof o.next === "string" ? [o.next] : [...o.next.branch.map((b) => b.goto), o.next.otherwise];
      for (const t of targets) best = Math.max(best, depth(t));
    }
    if (q.skipTo) best = Math.max(best, depth(q.skipTo) - 1);
    visiting.delete(id);
    memo.set(id, best + 1);
    return best + 1;
  };
  return depth(startId);
}

/**
 * Walks the decision tree from the start question using the stored answers and
 * known facts, then scores every outcome from the answers on the path taken.
 * Pure and deterministic: the same inputs always produce the same evaluation.
 */
export function evaluate(flow: DiagnosticFlow, state: DiagnosticState, baseFacts: Facts = {}): Evaluation {
  const qs = questionMap(flow);
  const outcomesById = new Map(flow.outcomes.map((o) => [o.id, o]));
  const facts: Facts = { ...baseFacts };
  const pathAnswers: Record<string, string> = {};
  const steps: PathStep[] = [];
  const issues: EngineIssue[] = [];
  const visited = new Set<string>();
  let current: Question | null = null;

  let qid = flow.start;
  while (qid !== RESULT) {
    if (visited.has(qid)) {
      issues.push({ kind: "cycle", questionId: qid });
      break;
    }
    visited.add(qid);
    const q = qs.get(qid);
    if (!q) {
      issues.push({ kind: "missing-question", questionId: qid });
      break;
    }
    const ctx: ConditionContext = { facts, answers: pathAnswers };

    if (q.skipWhen && q.skipTo && isTrue(q.skipWhen, ctx)) {
      qid = q.skipTo;
      continue;
    }

    let option: AnswerOption | undefined;
    let source: PathStep["source"] = "user";
    const chosen = state.answers[q.id];
    if (chosen !== undefined) {
      option = q.options.find((o) => o.id === chosen);
      if (!option) issues.push({ kind: "invalid-answer", questionId: q.id, optionId: chosen });
    }
    if (!option && q.autoAnswer) {
      const value = facts[q.autoAnswer.fact];
      const mapped = value !== undefined ? q.autoAnswer.map[value] : undefined;
      option = mapped ? q.options.find((o) => o.id === mapped) : undefined;
      if (option) source = "printer";
    }
    if (!option) {
      current = q;
      break;
    }

    steps.push({ question: q, option, source });
    pathAnswers[q.id] = option.id;
    Object.assign(facts, option.facts);
    qid = resolveNext(option.next, { facts, answers: pathAnswers });
  }

  const finished = current === null && !issues.some((i) => i.kind === "cycle" || i.kind === "missing-question");
  const ctx: ConditionContext = { facts, answers: pathAnswers };

  // Score outcomes from the answers on the path and from any matching rules.
  const contributions = new Map<string, Contribution[]>();
  const add = (c: Contribution) => {
    if (!outcomesById.has(c.outcomeId)) {
      issues.push({ kind: "unknown-outcome", outcomeId: c.outcomeId });
      return;
    }
    const list = contributions.get(c.outcomeId) ?? [];
    list.push(c);
    contributions.set(c.outcomeId, list);
  };
  for (const step of steps) {
    for (const [outcomeId, weight] of Object.entries(step.option.evidence)) {
      add({
        outcomeId,
        weight,
        kind: "answer",
        questionId: step.question.id,
        prompt: step.question.prompt,
        answerLabel: step.option.label,
      });
    }
  }
  for (const rule of flow.rules) {
    if (!isTrue(rule.when, ctx)) continue;
    for (const [outcomeId, weight] of Object.entries(rule.evidence)) {
      add({ outcomeId, weight, kind: "rule", reason: rule.reason });
    }
  }

  const excluded: Outcome[] = [];
  const scored: { outcome: Outcome; score: number; list: Contribution[]; order: number }[] = [];
  flow.outcomes.forEach((outcome, order) => {
    if (isTrue(outcome.notApplicableWhen, ctx)) {
      excluded.push(outcome);
      return;
    }
    const list = contributions.get(outcome.id) ?? [];
    const score = list.reduce((sum, c) => sum + c.weight, 0);
    if (score >= MIN_SCORE) scored.push({ outcome, score, list, order });
  });
  // Highest score first; authoring order breaks ties so the result is stable.
  scored.sort((a, b) => b.score - a.score || a.order - b.order);

  const toRanked = (items: typeof scored): RankedOutcome[] =>
    items.map((item, i) => ({
      outcome: item.outcome,
      score: item.score,
      confidence: confidenceFor(item.score, items[i + 1]?.score),
      supporting: item.list.filter((c) => c.weight > 0),
      against: item.list.filter((c) => c.weight < 0),
    }));

  const triedSet = new Set(state.tried);
  const ranking = toRanked(scored.filter((s) => !triedSet.has(s.outcome.id)));
  const tried = toRanked(scored.filter((s) => triedSet.has(s.outcome.id)));

  const safety = new Set<SafetyId>(flow.safety);
  for (const step of steps) step.question.safety.forEach((s) => safety.add(s));
  if (finished) ranking.slice(0, 3).forEach((r) => r.outcome.safety.forEach((s) => safety.add(s)));

  return {
    steps,
    current,
    remaining: current ? longestRemaining(flow, current.id) : 0,
    status: current || !finished ? "in-progress" : ranking.length > 0 ? "diagnosed" : "insufficient",
    ranking,
    tried,
    excluded,
    facts,
    safety: [...safety],
    issues,
  };
}

/** Records an answer. Answers to questions that came after it are cleared so they are asked again. */
export function answerQuestion(
  flow: DiagnosticFlow,
  state: DiagnosticState,
  questionId: string,
  optionId: string,
  facts: Facts = {},
): DiagnosticState {
  const q = questionMap(flow).get(questionId);
  if (!q || !q.options.some((o) => o.id === optionId)) {
    throw new Error(`Invalid answer "${optionId}" for question "${questionId}"`);
  }
  const before = evaluate(flow, state, facts);
  const index = before.steps.findIndex((s) => s.question.id === questionId);
  const answers: Record<string, string> = {};
  if (index === -1) {
    Object.assign(answers, pathAnswers(before));
  } else {
    for (const s of before.steps.slice(0, index)) if (s.source === "user") answers[s.question.id] = s.option.id;
  }
  answers[questionId] = optionId;
  return { ...state, answers };
}

/** Removes the most recent answer the user gave. Printer-derived answers are skipped over. */
export function goBack(flow: DiagnosticFlow, state: DiagnosticState, facts: Facts = {}): DiagnosticState {
  const ev = evaluate(flow, state, facts);
  const userSteps = ev.steps.filter((s) => s.source === "user");
  const last = userSteps[userSteps.length - 1];
  if (!last) return state;
  const answers = pathAnswers(ev);
  delete answers[last.question.id];
  return { ...state, answers };
}

/** Marks an outcome as tried-and-not-fixed so the next most likely cause is shown. */
export function markTried(state: DiagnosticState, outcomeId: string): DiagnosticState {
  if (state.tried.includes(outcomeId)) return state;
  return { ...state, tried: [...state.tried, outcomeId] };
}

function pathAnswers(ev: Evaluation): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const s of ev.steps) if (s.source === "user") answers[s.question.id] = s.option.id;
  return answers;
}

/** Drops stored answers that are not on the current path (for example after content changes). */
export function pruneToPath(flow: DiagnosticFlow, state: DiagnosticState, facts: Facts = {}): DiagnosticState {
  return { ...state, answers: pathAnswers(evaluate(flow, state, facts)) };
}
