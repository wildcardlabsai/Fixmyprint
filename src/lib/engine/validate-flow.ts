import { RESULT, type DiagnosticFlow, type Next } from "@/lib/schema/diagnostic";

export interface FlowProblem {
  flowId: string;
  message: string;
}

const targetsOf = (next: Next) =>
  typeof next === "string" ? [next] : [...next.branch.map((b) => b.goto), next.otherwise];

/**
 * Structural checks that a schema cannot express: every reference resolves,
 * the question graph is acyclic and fully reachable, and every outcome can
 * actually be reached with supporting evidence.
 */
export function validateFlowStructure(flow: DiagnosticFlow): FlowProblem[] {
  const problems: FlowProblem[] = [];
  const p = (message: string) => problems.push({ flowId: flow.id, message });
  const qIds = new Set<string>();
  for (const q of flow.questions) {
    if (qIds.has(q.id)) p(`Duplicate question id "${q.id}"`);
    qIds.add(q.id);
  }
  const outcomeIds = new Set<string>();
  for (const o of flow.outcomes) {
    if (outcomeIds.has(o.id)) p(`Duplicate outcome id "${o.id}"`);
    outcomeIds.add(o.id);
  }
  if (qIds.has(RESULT)) p(`"${RESULT}" is reserved and cannot be a question id`);
  if (!qIds.has(flow.start)) p(`Start question "${flow.start}" does not exist`);

  const positive = new Set<string>();
  for (const q of flow.questions) {
    const optionIds = new Set<string>();
    for (const o of q.options) {
      if (optionIds.has(o.id)) p(`Question "${q.id}" has duplicate option "${o.id}"`);
      optionIds.add(o.id);
      for (const t of targetsOf(o.next)) {
        if (t !== RESULT && !qIds.has(t)) p(`Option "${q.id}/${o.id}" points to missing question "${t}"`);
      }
      for (const [outcomeId, w] of Object.entries(o.evidence)) {
        if (!outcomeIds.has(outcomeId)) p(`Option "${q.id}/${o.id}" references missing outcome "${outcomeId}"`);
        if (w > 0) positive.add(outcomeId);
      }
    }
    if (q.autoAnswer) {
      for (const [value, optionId] of Object.entries(q.autoAnswer.map)) {
        if (!optionIds.has(optionId)) p(`Question "${q.id}" auto-answer for "${value}" maps to missing option "${optionId}"`);
      }
    }
    if (q.skipWhen && !q.skipTo) p(`Question "${q.id}" has skipWhen without skipTo`);
    if (q.skipTo && q.skipTo !== RESULT && !qIds.has(q.skipTo)) p(`Question "${q.id}" skips to missing "${q.skipTo}"`);
  }
  for (const r of flow.rules) {
    for (const [outcomeId, w] of Object.entries(r.evidence)) {
      if (!outcomeIds.has(outcomeId)) p(`Rule "${r.id}" references missing outcome "${outcomeId}"`);
      if (w > 0) positive.add(outcomeId);
    }
  }
  for (const o of flow.outcomes) {
    if (!positive.has(o.id)) p(`Outcome "${o.id}" never receives supporting evidence`);
  }

  // Reachability and cycle detection over the question graph.
  const byId = new Map(flow.questions.map((q) => [q.id, q]));
  const reachable = new Set<string>();
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string, trail: string[]) => {
    if (id === RESULT || !byId.has(id)) return;
    const s = state.get(id);
    if (s === "visiting") {
      p(`Cycle detected: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (s === "done") return;
    state.set(id, "visiting");
    reachable.add(id);
    const q = byId.get(id)!;
    for (const o of q.options) for (const t of targetsOf(o.next)) visit(t, [...trail, id]);
    if (q.skipTo) visit(q.skipTo, [...trail, id]);
    state.set(id, "done");
  };
  visit(flow.start, []);
  for (const id of qIds) if (!reachable.has(id)) p(`Question "${id}" is unreachable from the start`);

  return problems;
}
