import type { SeedContent } from "@/content";
import type { Condition } from "@/lib/schema";
import { validateFlowStructure } from "@/lib/engine/validate-flow";

/**
 * Cross-reference checks across all content: every slug, id and source a record
 * points at must exist. Returns a list of human-readable problems.
 */
export function checkContentIntegrity(c: SeedContent): string[] {
  const problems: string[] = [];
  const has = (set: Set<string>, id: string, where: string, kind: string) => {
    if (!set.has(id)) problems.push(`${where}: unknown ${kind} "${id}"`);
  };
  const unique = (ids: string[], kind: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`Duplicate ${kind} "${id}"`);
      seen.add(id);
    }
    return seen;
  };

  const sources = unique(c.sources.map((s) => s.id), "source");
  const manufacturers = unique(c.manufacturers.map((m) => m.slug), "manufacturer");
  const printers = unique(c.printers.map((p) => p.slug), "printer");
  const categories = unique(c.categories.map((x) => x.slug), "category");
  const symptoms = unique(c.symptoms.map((s) => s.slug), "symptom");
  const flows = unique(c.flows.map((f) => f.id), "flow");
  const guides = unique(c.guides.map((g) => g.slug), "guide");
  const filaments = unique(c.filaments.map((f) => f.slug), "filament");
  const parts = unique(c.parts.map((p) => p.slug), "part");
  unique(c.maintenance.map((m) => m.slug), "maintenance task");
  unique(c.errorCodes.map((e) => e.slug), "error code");
  const safety = unique(c.safetyNotices.map((s) => s.id), "safety notice");

  const checkSafety = (ids: string[], where: string) => ids.forEach((id) => has(safety, id, where, "safety notice"));
  const checkSources = (ids: string[], where: string) => ids.forEach((id) => has(sources, id, where, "source"));

  for (const p of c.printers) {
    const where = `printer ${p.slug}`;
    has(manufacturers, p.manufacturer, where, "manufacturer");
    checkSources(p.sourceIds, where);
    p.specs.supportedFilaments.forEach((f) => has(filaments, f, where, "filament"));
    for (const n of p.troubleshootingNotes) {
      n.guideSlugs.forEach((g) => has(guides, g, where, "guide"));
      n.symptomSlugs.forEach((s) => has(symptoms, s, where, "symptom"));
    }
    if (p.verification.status === "verified" && !p.lastVerified) problems.push(`${where}: verified without a lastVerified date`);
  }

  for (const s of c.symptoms) {
    const where = `symptom ${s.slug}`;
    has(categories, s.category, where, "category");
    if (s.flowId) has(flows, s.flowId, where, "flow");
    s.guideSlugs.forEach((g) => has(guides, g, where, "guide"));
  }

  for (const f of c.flows) {
    const where = `flow ${f.id}`;
    problems.push(...validateFlowStructure(f).map((p) => `${where}: ${p.message}`));
    has(categories, f.category, where, "category");
    f.symptomSlugs.forEach((s) => has(symptoms, s, where, "symptom"));
    checkSources(f.sourceIds, where);
    checkSafety(f.safety, where);
    for (const q of f.questions) checkSafety(q.safety, `${where} question ${q.id}`);
    for (const o of f.outcomes) {
      o.guideSlugs.forEach((g) => has(guides, g, `${where} outcome ${o.id}`, "guide"));
      checkSafety(o.safety, `${where} outcome ${o.id}`);
    }
  }

  for (const g of c.guides) {
    const where = `guide ${g.slug}`;
    has(categories, g.category, where, "category");
    g.symptomSlugs.forEach((s) => has(symptoms, s, where, "symptom"));
    g.printerSlugs.forEach((p) => has(printers, p, where, "printer"));
    g.parts.forEach((p) => p.partSlug && has(parts, p.partSlug, where, "part"));
    checkSafety(g.safety, where);
    g.steps.forEach((s) => checkSafety(s.safety, `${where} step ${s.id}`));
    unique(g.steps.map((s) => s.id), `step in ${where}`);
    if (g.ifFails.flowId) has(flows, g.ifFails.flowId, where, "flow");
    g.ifFails.guideSlugs.forEach((s) => has(guides, s, where, "guide"));
    checkSources(g.sourceIds, where);
    if (g.hardwareSelector) {
      const facts = new Set(g.hardwareSelector.options.map((o) => o.value));
      for (const s of g.steps) {
        if (s.appliesWhen && !conditionUsesOnly(s.appliesWhen, g.hardwareSelector.fact, facts)) {
          problems.push(`${where} step ${s.id}: condition uses a value the hardware selector cannot set`);
        }
      }
    }
  }

  for (const f of c.filaments) checkSources(f.sourceIds, `filament ${f.slug}`);
  for (const m of c.maintenance) {
    m.guideSlugs.forEach((g) => has(guides, g, `maintenance ${m.slug}`, "guide"));
    checkSafety(m.safety, `maintenance ${m.slug}`);
    checkSources(m.sourceIds, `maintenance ${m.slug}`);
  }
  for (const p of c.parts) {
    p.compatibility.forEach((x) => has(printers, x.printerSlug, `part ${p.slug}`, "printer"));
    if (p.replacementGuideSlug) has(guides, p.replacementGuideSlug, `part ${p.slug}`, "guide");
    checkSources(p.sourceIds, `part ${p.slug}`);
  }
  for (const e of c.errorCodes) {
    if (e.flowId) has(flows, e.flowId, `error ${e.slug}`, "flow");
    checkSafety(e.safety, `error ${e.slug}`);
    checkSources(e.sourceIds, `error ${e.slug}`);
  }

  return problems;
}

/** True when every fact test on `fact` in the condition uses values from `allowed`. */
function conditionUsesOnly(c: Condition, fact: string, allowed: Set<string>): boolean {
  if ("all" in c) return c.all.every((x) => conditionUsesOnly(x, fact, allowed));
  if ("any" in c) return c.any.every((x) => conditionUsesOnly(x, fact, allowed));
  if ("not" in c) return conditionUsesOnly(c.not, fact, allowed);
  if ("fact" in c && c.fact === fact) return c.in.every((v) => allowed.has(v));
  return true;
}
