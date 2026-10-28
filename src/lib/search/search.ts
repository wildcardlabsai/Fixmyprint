import type { SeedContent } from "@/content";
import { printerDisplayName } from "@/lib/data/selectors";

export type SearchType = "printer" | "symptom" | "error" | "guide" | "filament" | "maintenance" | "part" | "slicer";

export interface SearchDoc {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Strongest matches: the name and aliases. */
  names: string[];
  /** Weaker matches: descriptions, synonyms and related words. */
  keywords: string[];
}

export interface SearchResult {
  doc: SearchDoc;
  score: number;
}

export const TYPE_LABELS: Record<SearchType, string> = {
  printer: "Printer",
  symptom: "Problem",
  error: "Error message",
  guide: "Repair guide",
  filament: "Filament",
  maintenance: "Maintenance",
  part: "Part",
  slicer: "Slicer",
};

/** UK/US spellings and common shorthand mapped to one form. */
const VARIANTS: Record<string, string> = {
  leveling: "levelling",
  level: "levelling",
  levelled: "levelling",
  leveled: "levelling",
  color: "colour",
  colors: "colour",
  colours: "colour",
  fiber: "fibre",
  filled: "fibre",
  warp: "warping",
  warped: "warping",
  warps: "warping",
  clogged: "clog",
  clogs: "clog",
  clogging: "clog",
  jammed: "jam",
  strings: "stringing",
  string: "stringing",
  stringy: "stringing",
  zit: "zits",
  noises: "noise",
  noisy: "noise",
  shifted: "shift",
  shifting: "shift",
  shifts: "shift",
  stops: "stop",
  stopped: "stop",
  stopping: "stop",
  heater: "heating",
  heat: "heating",
  heats: "heating",
  temp: "temperature",
  temps: "temperature",
  wifi: "wi-fi",
  nozel: "nozzle",
  extruding: "extrusion",
  extrude: "extrusion",
  extruder: "extrusion",
  sticking: "stick",
  sticks: "stick",
  adhesive: "adhesion",
  polycarbonate: "pc",
  flexible: "tpu",
  slicers: "slicer",
  slicing: "slicer",
};

const STOP_WORDS = new Set(["the", "a", "an", "my", "is", "are", "of", "on", "to", "and", "or", "it", "its", "with", "how", "why", "do", "i", "me", "for", "in", "not"]);

export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[’']/g, "");
}

/** "Ender-3 V2" -> "ender3v2". Lets model names match however they are typed. */
export const compact = (text: string) => normalise(text).replace(/[^a-z0-9]/g, "");

export function tokens(text: string): string[] {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t))
    .map((t) => VARIANTS[t] ?? t);
}

/** Optimal string alignment distance, capped for speed. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length]![b.length]!;
}

interface IndexedDoc {
  doc: SearchDoc;
  nameTokens: Set<string>;
  keywordTokens: Set<string>;
  compactNames: string[];
}

export interface SearchIndex {
  docs: IndexedDoc[];
}

export function buildIndex(c: SeedContent): SearchIndex {
  const docs: SearchDoc[] = [];
  const manufacturerName = (slug: string) => c.manufacturers.find((m) => m.slug === slug);

  for (const p of c.printers) {
    const m = manufacturerName(p.manufacturer);
    const display = printerDisplayName(c, p);
    docs.push({
      type: "printer",
      id: p.slug,
      title: display,
      subtitle: p.summary,
      href: `/printers/${p.slug}`,
      names: [display, p.name, ...p.aliases, ...(m ? [`${m.name} ${p.name}`, ...m.aliases.map((a) => `${a} ${p.name}`)] : [])],
      keywords: [m?.name ?? "", ...(m?.aliases ?? []), p.family ?? "", ...p.variants.map((v) => v.name)],
    });
  }
  for (const s of c.symptoms) {
    docs.push({
      type: "symptom",
      id: s.slug,
      title: s.title,
      subtitle: s.description,
      href: s.flowId ? `/diagnose/${s.flowId}` : `/problems/${s.category}`,
      names: [s.title, ...s.synonyms],
      keywords: [s.description, c.categories.find((x) => x.slug === s.category)?.title ?? ""],
    });
  }
  for (const e of c.errorCodes) {
    docs.push({
      type: "error",
      id: e.slug,
      title: e.message,
      subtitle: `${e.firmwareLabel}. ${e.meaning}`,
      href: `/error-codes/${e.slug}`,
      names: [e.message, ...e.aliases],
      keywords: [e.firmwareLabel, e.meaning],
    });
  }
  for (const g of c.guides) {
    docs.push({ type: "guide", id: g.slug, title: g.title, subtitle: g.summary, href: `/guides/${g.slug}`, names: [g.title], keywords: [g.summary, g.problem, ...g.steps.map((s) => s.title)] });
  }
  for (const f of c.filaments) {
    docs.push({ type: "filament", id: f.slug, title: f.name, subtitle: f.fullName, href: `/filament/${f.slug}`, names: [f.name, f.fullName, ...f.aliases], keywords: [f.summary, "filament", "settings", "temperature"] });
  }
  for (const m of c.maintenance) {
    docs.push({ type: "maintenance", id: m.slug, title: m.title, subtitle: m.summary, href: `/maintenance#${m.slug}`, names: [m.title], keywords: [m.summary, "maintenance", m.area] });
  }
  for (const p of c.parts) {
    docs.push({ type: "part", id: p.slug, title: p.name, subtitle: p.description, href: `/parts#${p.slug}`, names: [p.name], keywords: [p.description, p.category, "part", "replacement"] });
  }
  for (const s of c.slicers) {
    docs.push({
      type: "slicer",
      id: s.slug,
      title: s.name,
      subtitle: s.summary,
      href: `/slicers/${s.slug}`,
      names: [s.name, ...s.aliases, ...s.formerNames],
      keywords: [s.developer, "slicer", "software", s.summary, ...Object.values(s.settings).map((x) => x.name)],
    });
  }

  return {
    docs: docs.map((doc) => ({
      doc,
      nameTokens: new Set(doc.names.flatMap(tokens)),
      keywordTokens: new Set(doc.keywords.flatMap(tokens)),
      compactNames: doc.names.map(compact).filter(Boolean),
    })),
  };
}

function tokenScore(q: string, set: Set<string>): number {
  if (set.has(q)) return 10;
  let best = 0;
  for (const t of set) {
    if (q.length >= 2 && t.startsWith(q)) best = Math.max(best, q.length >= 3 ? 7 : 4);
    else if (q.length >= 4 && t.length >= 4) {
      const allowed = q.length >= 8 ? 2 : 1;
      if (editDistance(q, t, allowed) <= allowed) best = Math.max(best, 5);
    }
  }
  return best;
}

/**
 * Ranks documents for a query. Every query word must match something in the
 * document (name, alias or keyword), allowing prefixes and small typos.
 */
export function search(index: SearchIndex, query: string, limit = 20): SearchResult[] {
  const qTokens = tokens(query);
  const qCompact = compact(query);
  if (qCompact.length < 2) return [];

  const results: SearchResult[] = [];
  for (const item of index.docs) {
    let score = 0;
    // Whole-name matches catch model numbers typed without spaces or punctuation.
    for (const n of item.compactNames) {
      if (n === qCompact) score = Math.max(score, 120);
      else if (qCompact.length >= 3 && n.startsWith(qCompact)) score = Math.max(score, 80);
      else if (qCompact.length >= 4 && n.includes(qCompact)) score = Math.max(score, 50);
    }

    let tokenTotal = 0;
    let allMatched = qTokens.length > 0;
    for (const q of qTokens) {
      const nameHit = tokenScore(q, item.nameTokens) * 2;
      const keywordHit = tokenScore(q, item.keywordTokens);
      const best = Math.max(nameHit, keywordHit);
      if (best === 0) {
        allMatched = false;
        break;
      }
      tokenTotal += best;
    }
    if (allMatched) score = Math.max(score, tokenTotal);
    if (score > 0) results.push({ doc: item.doc, score });
  }

  return results.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title)).slice(0, limit);
}
