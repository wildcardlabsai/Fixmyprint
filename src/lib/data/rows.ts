import type { RawContent, SeedContent } from "@/content";
import type { Verification } from "@/lib/schema";

/**
 * Maps the content model to and from the relational tables defined in
 * supabase/migrations. Used by the seed script (content -> rows) and the
 * Supabase repository (rows -> content). A round-trip test keeps both in step.
 */

type Row = Record<string, unknown>;
export type TableRows = Record<(typeof TABLE_ORDER)[number], Row[]>;

/** Insert order respecting foreign keys. Delete in reverse. */
export const TABLE_ORDER = [
  "source_references",
  "safety_notices",
  "manufacturers",
  "printer_models",
  "printer_specifications",
  "printer_variants",
  "symptom_categories",
  "diagnostic_flows",
  "symptoms",
  "diagnostic_flow_symptoms",
  "diagnostic_questions",
  "diagnostic_outcomes",
  "diagnostic_answer_options",
  "diagnostic_option_evidence",
  "diagnostic_rules",
  "diagnostic_rule_evidence",
  "repair_guides",
  "repair_steps",
  "guide_symptoms",
  "guide_printers",
  "symptom_guides",
  "diagnostic_outcome_guides",
  "filament_profiles",
  "maintenance_tasks",
  "parts",
  "part_compatibility",
  "guide_parts",
  "error_codes",
  "slicers",
  "slicer_links",
  "content_sources",
] as const;

const u = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

const toV = (v: Verification) => ({
  review_status: v.status,
  author: v.author,
  reviewed_by_name: v.reviewedBy,
  last_reviewed: v.lastReviewed,
  verification_notes: n(v.notes),
  known_limitations: v.knownLimitations,
});

const fromV = (r: Row): Verification => ({
  status: r.review_status as Verification["status"],
  author: r.author as string,
  reviewedBy: (r.reviewed_by_name as string | null) ?? null,
  lastReviewed: (r.last_reviewed as string | null) ?? null,
  notes: u(r.verification_notes as string | null),
  knownLimitations: (r.known_limitations as string[]) ?? [],
});

const flowKey = (id: string, version: number) => `${id}@${version}`;

export function contentToRows(c: SeedContent): TableRows {
  const rows = Object.fromEntries(TABLE_ORDER.map((t) => [t, [] as Row[]])) as TableRows;
  const sourceLink = (entityType: string, entityKey: string, ids: string[]) =>
    ids.forEach((source_id, position) => rows.content_sources.push({ entity_type: entityType, entity_key: entityKey, source_id, position }));

  rows.source_references = c.sources.map((s) => ({ id: s.id, title: s.title, publisher: s.publisher, url: n(s.url), kind: s.kind, note: n(s.note) }));
  rows.safety_notices = c.safetyNotices.map((s) => ({ ...s }));
  rows.manufacturers = c.manufacturers.map((m) => ({ slug: m.slug, name: m.name, website: m.website, support_url: m.supportUrl, aliases: m.aliases }));

  for (const p of c.printers) {
    rows.printer_models.push({
      slug: p.slug,
      manufacturer_slug: p.manufacturer,
      name: p.name,
      family: p.family,
      aliases: p.aliases,
      summary: p.summary,
      documentation: p.documentation,
      troubleshooting_notes: p.troubleshootingNotes,
      spec_sources: p.specSources,
      confidence_notes: p.confidenceNotes,
      last_verified: p.lastVerified,
      ...toV(p.verification),
    });
    const s = p.specs;
    rows.printer_specifications.push({
      printer_slug: p.slug,
      printer_type: s.printerType,
      motion_system: s.motionSystem,
      linear_motion: s.linearMotion,
      build_x_mm: s.buildVolumeMm?.x ?? null,
      build_y_mm: s.buildVolumeMm?.y ?? null,
      build_z_mm: s.buildVolumeMm?.z ?? null,
      hotend_max_temp_c: s.hotendMaxTempC,
      enclosure: s.enclosure,
      levelling: s.levelling,
      extruder: s.extruder,
      firmware_family: s.firmwareFamily,
      details: {
        bed: s.bed,
        levellingDetail: s.levellingDetail,
        extruderDetail: s.extruderDetail,
        nozzle: s.nozzle,
        multiMaterial: s.multiMaterial,
        firmwareDetail: s.firmwareDetail,
        connectivity: s.connectivity,
        supportedFilaments: s.supportedFilaments,
      },
    });
    p.variants.forEach((v, position) =>
      rows.printer_variants.push({ printer_slug: p.slug, slug: v.slug, name: v.name, kind: v.kind, description: v.description, spec_overrides: v.specOverrides, position }),
    );
    sourceLink("printer", p.slug, p.sourceIds);
  }

  rows.symptom_categories = c.categories.map((x, position) => ({ ...x, position }));
  c.symptoms.forEach((s, position) => {
    rows.symptoms.push({ slug: s.slug, category_slug: s.category, title: s.title, description: s.description, synonyms: s.synonyms, flow_key: s.flowId, common: s.common, position });
    s.guideSlugs.forEach((g, i) => rows.symptom_guides.push({ symptom_slug: s.slug, guide_slug: g, position: i }));
  });

  for (const f of c.flows) {
    const k = { flow_key: f.id, flow_version: f.version };
    rows.diagnostic_flows.push({
      key: f.id,
      version: f.version,
      title: f.title,
      summary: f.summary,
      category_slug: f.category,
      start_question: f.start,
      entry_conditions: n(f.entryConditions),
      safety: f.safety,
      insufficient: f.insufficient,
      ...toV(f.verification),
    });
    f.symptomSlugs.forEach((symptom_slug) => rows.diagnostic_flow_symptoms.push({ ...k, symptom_slug }));
    f.questions.forEach((q, position) => {
      rows.diagnostic_questions.push({ ...k, key: q.id, position, prompt: q.prompt, why: q.why, help: n(q.help), auto_answer: n(q.autoAnswer), skip_when: n(q.skipWhen), skip_to: n(q.skipTo), safety: q.safety });
      q.options.forEach((o, i) => {
        rows.diagnostic_answer_options.push({ ...k, question_key: q.id, key: o.id, position: i, label: o.label, detail: n(o.detail), next: o.next, facts: o.facts, uncertain: o.uncertain });
        for (const [outcome_key, weight] of Object.entries(o.evidence)) {
          rows.diagnostic_option_evidence.push({ ...k, question_key: q.id, option_key: o.id, outcome_key, weight });
        }
      });
    });
    f.outcomes.forEach((o, position) => {
      rows.diagnostic_outcomes.push({ ...k, key: o.id, position, title: o.title, summary: o.summary, explanation: o.explanation, checks: o.checks, slicer_settings: o.slicerSettings, safety: o.safety, escalation: n(o.escalation), not_applicable_when: n(o.notApplicableWhen) });
      o.guideSlugs.forEach((guide_slug, i) => rows.diagnostic_outcome_guides.push({ ...k, outcome_key: o.id, guide_slug, position: i }));
    });
    f.rules.forEach((r, position) => {
      rows.diagnostic_rules.push({ ...k, key: r.id, position, condition: r.when, reason: r.reason });
      for (const [outcome_key, weight] of Object.entries(r.evidence)) rows.diagnostic_rule_evidence.push({ ...k, rule_key: r.id, outcome_key, weight });
    });
    sourceLink("flow", flowKey(f.id, f.version), f.sourceIds);
  }

  for (const g of c.guides) {
    rows.repair_guides.push({
      slug: g.slug,
      title: g.title,
      summary: g.summary,
      problem: g.problem,
      category_slug: g.category,
      applies_note: g.appliesNote,
      applies_when: n(g.appliesWhen),
      difficulty: g.difficulty,
      time_min_minutes: g.timeMinutes?.min ?? null,
      time_max_minutes: g.timeMinutes?.max ?? null,
      tools: g.tools,
      safety: g.safety,
      hardware_selector: n(g.hardwareSelector),
      settings: g.settings,
      slicer_settings: g.slicerSettings,
      expected_result: g.expectedResult,
      verification_steps: g.verificationSteps,
      if_fails: g.ifFails,
      ...toV(g.verification),
    });
    g.steps.forEach((s, position) =>
      rows.repair_steps.push({ guide_slug: g.slug, key: s.id, position, title: s.title, body: s.body, applies_when: n(s.appliesWhen), applies_label: n(s.appliesLabel), warning: n(s.warning), tip: n(s.tip), safety: s.safety, diagram: n(s.diagram) }),
    );
    g.symptomSlugs.forEach((symptom_slug) => rows.guide_symptoms.push({ guide_slug: g.slug, symptom_slug }));
    g.printerSlugs.forEach((printer_slug) => rows.guide_printers.push({ guide_slug: g.slug, printer_slug }));
    g.parts.forEach((p, position) => rows.guide_parts.push({ guide_slug: g.slug, position, name: p.name, part_slug: n(p.partSlug), optional: p.optional }));
    sourceLink("guide", g.slug, g.sourceIds);
  }

  for (const f of c.filaments) {
    rows.filament_profiles.push({
      slug: f.slug,
      name: f.name,
      full_name: f.fullName,
      aliases: f.aliases,
      material_group: f.group,
      summary: f.summary,
      nozzle_min_c: f.nozzleTempC.min,
      nozzle_max_c: f.nozzleTempC.max,
      bed_min_c: f.bedTempC?.min ?? null,
      bed_max_c: f.bedTempC?.max ?? null,
      fan_min_percent: f.coolingFanPercent.min,
      fan_max_percent: f.coolingFanPercent.max,
      enclosure: f.enclosure,
      moisture: f.moisture,
      drying: f.drying,
      abrasive: f.abrasive,
      requires_hardened_nozzle: f.requiresHardenedNozzle,
      direct_drive_preferred: f.directDrivePreferred,
      bed_surface_notes: f.bedSurfaceNotes,
      printing_notes: f.printingNotes,
      safety_notes: f.safetyNotes,
      safety: f.safety,
      manufacturer_profiles: f.manufacturerProfiles,
      ...toV(f.verification),
    });
    sourceLink("filament", f.slug, f.sourceIds);
  }

  for (const m of c.maintenance) {
    rows.maintenance_tasks.push({
      slug: m.slug,
      title: m.title,
      summary: m.summary,
      area: m.area,
      interval_label: m.interval.label,
      sort_hours: m.interval.sortHours,
      applies_when: n(m.appliesWhen),
      applies_label: n(m.appliesLabel),
      tools: m.tools,
      steps: m.steps,
      cautions: m.cautions,
      safety: m.safety,
      guide_slugs: m.guideSlugs,
      ...toV(m.verification),
    });
    sourceLink("maintenance", m.slug, m.sourceIds);
  }

  for (const p of c.parts) {
    rows.parts.push({ slug: p.slug, name: p.name, category: p.category, description: p.description, specs: p.specs, replacement_guide_slug: n(p.replacementGuideSlug), supplier: p.supplier, ...toV(p.verification) });
    p.compatibility.forEach((x) => rows.part_compatibility.push({ part_slug: p.slug, printer_slug: x.printerSlug, status: x.status, note: n(x.note) }));
    sourceLink("part", p.slug, p.sourceIds);
  }

  for (const e of c.errorCodes) {
    rows.error_codes.push({
      slug: e.slug,
      message: e.message,
      aliases: e.aliases,
      firmware_family: e.firmwareFamily,
      firmware_label: e.firmwareLabel,
      meaning: e.meaning,
      first_steps: e.firstSteps,
      flow_key: e.flowId,
      safety: e.safety,
      ...toV(e.verification),
    });
    sourceLink("error-code", e.slug, e.sourceIds);
  }

  // Parents before the slicers built on them, so the based_on reference exists on insert.
  const depth = (slug: string | null, seen = new Set<string>()): number => {
    const s = slug ? c.slicers.find((x) => x.slug === slug) : undefined;
    if (!s || seen.has(s.slug)) return 0;
    seen.add(s.slug);
    return 1 + depth(s.basedOn, seen);
  };
  for (const s of [...c.slicers].sort((a, b) => depth(a.slug) - depth(b.slug))) {
    rows.slicers.push({
      slug: s.slug,
      name: s.name,
      developer: s.developer,
      aliases: s.aliases,
      former_names: s.formerNames,
      based_on: s.basedOn,
      lineage: n(s.lineage),
      open_source: s.openSource,
      licence: s.licence,
      platforms: s.platforms,
      url: s.url,
      summary: s.summary,
      settings: s.settings,
      calibration_tools: s.calibrationTools,
      notes: s.notes,
      sources: s.sources,
      ...toV(s.verification),
    });
    s.usedBy.forEach((l, position) =>
      rows.slicer_links.push({ slicer_slug: s.slug, position, manufacturer_slug: l.manufacturer, printer_slugs: l.printerSlugs, relation: l.relation, note: n(l.note), source_url: l.sourceUrl }),
    );
  }

  return rows;
}

/** Groups child rows by a key, preserving `position` order. */
function groupBy(rows: Row[], key: (r: Row) => string): Map<string, Row[]> {
  const map = new Map<string, Row[]>();
  const sorted = [...rows].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  for (const r of sorted) {
    const k = key(r);
    const list = map.get(k) ?? [];
    list.push(r);
    map.set(k, list);
  }
  return map;
}

const byPosition = (rows: Row[]) => [...rows].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
const bySlug = (rows: Row[]) => [...rows].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

/**
 * Rebuilds raw content from table rows. Only the latest non-draft version of
 * each flow is used. The result still has to pass `parseContent` validation.
 */
export function rowsToContent(r: TableRows): RawContent {
  const sources = groupBy(r.content_sources, (x) => `${x.entity_type}:${x.entity_key}`);
  const sourceIds = (type: string, key: string) => (sources.get(`${type}:${key}`) ?? []).map((x) => x.source_id as string);
  const specs = new Map(r.printer_specifications.map((s) => [s.printer_slug as string, s]));
  const variants = groupBy(r.printer_variants, (x) => x.printer_slug as string);

  const printers = bySlug(r.printer_models).map((p) => {
    const s = specs.get(p.slug as string) ?? {};
    const d = (s.details ?? {}) as Row;
    const hasVolume = s.build_x_mm != null && s.build_y_mm != null && s.build_z_mm != null;
    return {
      slug: p.slug,
      manufacturer: p.manufacturer_slug,
      name: p.name,
      family: p.family ?? null,
      aliases: p.aliases,
      summary: p.summary,
      specs: {
        printerType: s.printer_type ?? "fdm",
        motionSystem: s.motion_system ?? null,
        linearMotion: s.linear_motion ?? null,
        buildVolumeMm: hasVolume ? { x: Number(s.build_x_mm), y: Number(s.build_y_mm), z: Number(s.build_z_mm) } : null,
        hotendMaxTempC: s.hotend_max_temp_c ?? null,
        bed: d.bed ?? null,
        enclosure: s.enclosure ?? null,
        levelling: s.levelling ?? null,
        levellingDetail: d.levellingDetail ?? null,
        extruder: s.extruder ?? null,
        extruderDetail: d.extruderDetail ?? null,
        nozzle: d.nozzle ?? null,
        multiMaterial: d.multiMaterial ?? [],
        firmwareFamily: s.firmware_family ?? null,
        firmwareDetail: d.firmwareDetail ?? null,
        connectivity: d.connectivity ?? [],
        supportedFilaments: d.supportedFilaments ?? [],
      },
      variants: (variants.get(p.slug as string) ?? []).map((v) => ({ slug: v.slug, name: v.name, kind: v.kind, description: v.description, specOverrides: v.spec_overrides })),
      troubleshootingNotes: p.troubleshooting_notes,
      documentation: p.documentation,
      sourceIds: sourceIds("printer", p.slug as string),
      specSources: p.spec_sources ?? [],
      confidenceNotes: p.confidence_notes,
      lastVerified: p.last_verified ?? null,
      verification: fromV(p),
    };
  });

  // Latest non-draft version of each flow.
  const latest = new Map<string, Row>();
  for (const f of r.diagnostic_flows) {
    if (f.review_status === "draft") continue;
    const prev = latest.get(f.key as string);
    if (!prev || Number(f.version) > Number(prev.version)) latest.set(f.key as string, f);
  }
  const fk = (x: Row) => flowKey(x.flow_key as string, Number(x.flow_version));
  const qByFlow = groupBy(r.diagnostic_questions, fk);
  const oByQuestion = groupBy(r.diagnostic_answer_options, (x) => `${fk(x)}/${x.question_key}`);
  const evByOption = groupBy(r.diagnostic_option_evidence, (x) => `${fk(x)}/${x.question_key}/${x.option_key}`);
  const outByFlow = groupBy(r.diagnostic_outcomes, fk);
  const ogByOutcome = groupBy(r.diagnostic_outcome_guides, (x) => `${fk(x)}/${x.outcome_key}`);
  const rulesByFlow = groupBy(r.diagnostic_rules, fk);
  const reByRule = groupBy(r.diagnostic_rule_evidence, (x) => `${fk(x)}/${x.rule_key}`);
  const symByFlow = groupBy(r.diagnostic_flow_symptoms, fk);
  const evidence = (list: Row[] | undefined) => Object.fromEntries((list ?? []).map((e) => [e.outcome_key as string, Number(e.weight)]));

  const flowOrder = new Map(r.diagnostic_flows.map((f, i) => [f.key as string, i]));
  const flows = [...latest.values()]
    .sort((a, b) => (flowOrder.get(a.key as string) ?? 0) - (flowOrder.get(b.key as string) ?? 0))
    .map((f) => {
      const key = flowKey(f.key as string, Number(f.version));
      return {
        id: f.key,
        version: Number(f.version),
        title: f.title,
        summary: f.summary,
        category: f.category_slug,
        symptomSlugs: (symByFlow.get(key) ?? []).map((s) => s.symptom_slug),
        entryConditions: u(f.entry_conditions),
        start: f.start_question,
        questions: (qByFlow.get(key) ?? []).map((q) => ({
          id: q.key,
          prompt: q.prompt,
          why: q.why,
          help: u(q.help),
          autoAnswer: u(q.auto_answer),
          skipWhen: u(q.skip_when),
          skipTo: u(q.skip_to),
          safety: q.safety,
          options: (oByQuestion.get(`${key}/${q.key}`) ?? []).map((o) => ({
            id: o.key,
            label: o.label,
            detail: u(o.detail),
            next: o.next,
            evidence: evidence(evByOption.get(`${key}/${q.key}/${o.key}`)),
            facts: o.facts,
            uncertain: o.uncertain,
          })),
        })),
        outcomes: (outByFlow.get(key) ?? []).map((o) => ({
          id: o.key,
          title: o.title,
          summary: o.summary,
          explanation: o.explanation,
          checks: o.checks,
          slicerSettings: o.slicer_settings ?? [],
          guideSlugs: (ogByOutcome.get(`${key}/${o.key}`) ?? []).map((g) => g.guide_slug),
          safety: o.safety,
          escalation: u(o.escalation),
          notApplicableWhen: u(o.not_applicable_when),
        })),
        rules: (rulesByFlow.get(key) ?? []).map((x) => ({ id: x.key, when: x.condition, evidence: evidence(reByRule.get(`${key}/${x.key}`)), reason: x.reason })),
        safety: f.safety,
        insufficient: f.insufficient,
        sourceIds: sourceIds("flow", key),
        verification: fromV(f),
      };
    });

  const stepsByGuide = groupBy(r.repair_steps, (x) => x.guide_slug as string);
  const partsByGuide = groupBy(r.guide_parts, (x) => x.guide_slug as string);
  const symptomsByGuide = groupBy(r.guide_symptoms, (x) => x.guide_slug as string);
  const printersByGuide = groupBy(r.guide_printers, (x) => x.guide_slug as string);
  const guides = bySlug(r.repair_guides).map((g) => ({
    slug: g.slug,
    title: g.title,
    summary: g.summary,
    problem: g.problem,
    category: g.category_slug,
    symptomSlugs: (symptomsByGuide.get(g.slug as string) ?? []).map((x) => x.symptom_slug),
    printerSlugs: (printersByGuide.get(g.slug as string) ?? []).map((x) => x.printer_slug),
    appliesNote: g.applies_note,
    appliesWhen: u(g.applies_when),
    difficulty: g.difficulty,
    timeMinutes: g.time_min_minutes != null && g.time_max_minutes != null ? { min: g.time_min_minutes, max: g.time_max_minutes } : null,
    tools: g.tools,
    parts: (partsByGuide.get(g.slug as string) ?? []).map((p) => ({ name: p.name, partSlug: u(p.part_slug), optional: p.optional })),
    safety: g.safety,
    hardwareSelector: u(g.hardware_selector),
    steps: (stepsByGuide.get(g.slug as string) ?? []).map((s) => ({
      id: s.key,
      title: s.title,
      body: s.body,
      appliesWhen: u(s.applies_when),
      appliesLabel: u(s.applies_label),
      warning: u(s.warning),
      tip: u(s.tip),
      safety: s.safety,
      diagram: u(s.diagram),
    })),
    settings: g.settings,
    slicerSettings: g.slicer_settings ?? [],
    expectedResult: g.expected_result,
    verificationSteps: g.verification_steps,
    ifFails: g.if_fails,
    sourceIds: sourceIds("guide", g.slug as string),
    verification: fromV(g),
  }));

  const linksBySlicer = groupBy(r.slicer_links, (x) => x.slicer_slug as string);
  const slicers = bySlug(r.slicers).map((s) => ({
    slug: s.slug,
    name: s.name,
    developer: s.developer,
    aliases: s.aliases,
    formerNames: s.former_names,
    basedOn: s.based_on ?? null,
    lineage: u(s.lineage),
    openSource: s.open_source ?? null,
    licence: s.licence ?? null,
    platforms: s.platforms,
    url: s.url,
    summary: s.summary,
    settings: s.settings,
    calibrationTools: s.calibration_tools,
    notes: s.notes,
    usedBy: (linksBySlicer.get(s.slug as string) ?? []).map((l) => ({
      manufacturer: l.manufacturer_slug,
      printerSlugs: l.printer_slugs,
      relation: l.relation,
      note: u(l.note),
      sourceUrl: l.source_url,
    })),
    sources: s.sources,
    verification: fromV(s),
  }));

  const symptomGuides = groupBy(r.symptom_guides, (x) => x.symptom_slug as string);
  const compat = groupBy(r.part_compatibility, (x) => x.part_slug as string);

  return {
    sources: [...r.source_references]
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((s) => ({ id: s.id, title: s.title, publisher: s.publisher, url: u(s.url), kind: s.kind, note: u(s.note) })),
    safetyNotices: [...r.safety_notices].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    manufacturers: bySlug(r.manufacturers).map((m) => ({ slug: m.slug, name: m.name, website: m.website ?? null, supportUrl: m.support_url ?? null, aliases: m.aliases })),
    printers,
    categories: byPosition(r.symptom_categories).map((x) => ({ slug: x.slug, title: x.title, description: x.description, icon: x.icon })),
    symptoms: byPosition(r.symptoms).map((s) => ({
      slug: s.slug,
      category: s.category_slug,
      title: s.title,
      description: s.description,
      synonyms: s.synonyms,
      flowId: s.flow_key ?? null,
      guideSlugs: (symptomGuides.get(s.slug as string) ?? []).map((g) => g.guide_slug),
      common: s.common,
    })),
    flows,
    guides,
    filaments: bySlug(r.filament_profiles).map((f) => ({
      slug: f.slug,
      name: f.name,
      fullName: f.full_name,
      aliases: f.aliases,
      group: f.material_group,
      summary: f.summary,
      nozzleTempC: { min: f.nozzle_min_c, max: f.nozzle_max_c },
      bedTempC: f.bed_min_c != null && f.bed_max_c != null ? { min: f.bed_min_c, max: f.bed_max_c } : null,
      coolingFanPercent: { min: f.fan_min_percent, max: f.fan_max_percent },
      enclosure: f.enclosure,
      moisture: f.moisture,
      drying: f.drying ?? null,
      abrasive: f.abrasive,
      requiresHardenedNozzle: f.requires_hardened_nozzle,
      directDrivePreferred: f.direct_drive_preferred,
      bedSurfaceNotes: f.bed_surface_notes,
      printingNotes: f.printing_notes,
      safetyNotes: f.safety_notes,
      safety: f.safety,
      manufacturerProfiles: f.manufacturer_profiles,
      sourceIds: sourceIds("filament", f.slug as string),
      verification: fromV(f),
    })),
    maintenance: bySlug(r.maintenance_tasks).map((m) => ({
      slug: m.slug,
      title: m.title,
      summary: m.summary,
      area: m.area,
      interval: { label: m.interval_label, sortHours: Number(m.sort_hours) },
      appliesWhen: u(m.applies_when),
      appliesLabel: u(m.applies_label),
      tools: m.tools,
      steps: m.steps,
      cautions: m.cautions,
      safety: m.safety,
      guideSlugs: m.guide_slugs,
      sourceIds: sourceIds("maintenance", m.slug as string),
      verification: fromV(m),
    })),
    parts: bySlug(r.parts).map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      specs: p.specs,
      compatibility: (compat.get(p.slug as string) ?? []).map((x) => ({ printerSlug: x.printer_slug, status: x.status, note: u(x.note) })),
      replacementGuideSlug: u(p.replacement_guide_slug),
      supplier: p.supplier ?? null,
      sourceIds: sourceIds("part", p.slug as string),
      verification: fromV(p),
    })),
    errorCodes: bySlug(r.error_codes).map((e) => ({
      slug: e.slug,
      message: e.message,
      aliases: e.aliases,
      firmwareFamily: e.firmware_family,
      firmwareLabel: e.firmware_label,
      meaning: e.meaning,
      firstSteps: e.first_steps,
      flowId: e.flow_key ?? null,
      safety: e.safety,
      sourceIds: sourceIds("error-code", e.slug as string),
      verification: fromV(e),
    })),
    slicers,
  };
}
