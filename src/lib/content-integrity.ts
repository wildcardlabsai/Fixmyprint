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

  // Visual assets: every reference resolves, and an image is only used for what it depicts.
  const assets = new Map(c.visualAssets.map((a) => [a.id, a]));
  unique(c.visualAssets.map((a) => a.id), "visual asset");
  const assetFor = (id: string, where: string, allowed: string[]) => {
    const a = assets.get(id);
    if (!a) return problems.push(`${where}: unknown visual asset "${id}"`);
    if (!allowed.includes(a.subject)) problems.push(`${where}: image "${id}" depicts ${a.subject}, not ${allowed.join(" or ")}`);
  };
  const symptomSubjects = new Set(c.symptoms.map((s) => `symptom:${s.slug}`));
  for (const s of c.symptoms) {
    s.images.forEach((id) => assetFor(id, `symptom ${s.slug}`, [`symptom:${s.slug}`]));
    const category = c.categories.find((x) => x.slug === s.category);
    if (category && !s.printerTypes.every((t) => category.printerTypes.includes(t))) problems.push(`symptom ${s.slug}: printer types not covered by its category`);
    const flow = s.flowId ? c.flows.find((f) => f.id === s.flowId) : undefined;
    if (flow && !s.printerTypes.every((t) => flow.printerTypes.includes(t))) problems.push(`symptom ${s.slug}: printer types not covered by flow ${flow.id}`);
    for (const [q, o] of Object.entries(s.preset)) {
      const question = flow?.questions.find((x) => x.id === q);
      if (!flow) problems.push(`symptom ${s.slug}: preset answers need a flow`);
      else if (!question?.options.some((x) => x.id === o)) problems.push(`symptom ${s.slug}: preset ${q}=${o} is not an option in ${flow.id}`);
    }
  }
  for (const f of c.flows) {
    for (const q of f.questions) {
      for (const o of q.options) {
        if (!o.image) continue;
        const own = `option:${f.id}/${q.id}/${o.id}`;
        const a = assets.get(o.image);
        // An option may show its own comparison image, or the image of the symptom it describes.
        assetFor(o.image, `flow ${f.id} option ${q.id}/${o.id}`, a && symptomSubjects.has(a.subject) ? [a.subject] : [own]);
      }
    }
  }
  for (const g of c.guides) g.steps.forEach((st) => st.image && assetFor(st.image, `guide ${g.slug} step ${st.id}`, [assets.get(st.image)?.subject ?? ""]));

  const slicers = unique(c.slicers.map((s) => s.slug), "slicer");
  for (const s of c.slicers) {
    const where = `slicer ${s.slug}`;
    if (s.basedOn) has(slicers, s.basedOn, where, "slicer");
    for (const link of s.usedBy) {
      has(manufacturers, link.manufacturer, where, "manufacturer");
      for (const slug of link.printerSlugs) {
        const printer = c.printers.find((p) => p.slug === slug);
        if (!printer) problems.push(`${where}: unknown printer "${slug}"`);
        else if (printer.manufacturer !== link.manufacturer) problems.push(`${where}: printer "${slug}" is not made by ${link.manufacturer}`);
      }
    }
    const seen = new Set([s.slug]);
    for (let parent = s.basedOn; parent; parent = c.slicers.find((x) => x.slug === parent)?.basedOn ?? null) {
      if (seen.has(parent)) {
        problems.push(`${where}: basedOn forms a cycle`);
        break;
      }
      seen.add(parent);
    }
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
