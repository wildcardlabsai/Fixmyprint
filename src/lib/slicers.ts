import type { SeedContent } from "@/content";
import type { PrinterModel, Slicer, SlicerLink, SlicerSetting, SlicerSettingKey } from "@/lib/schema";

/** Pure slicer lookups. Safe on server and client. */

type Slicers = Pick<SeedContent, "slicers">;

export const findSlicer = (c: Slicers, slug: string | null | undefined) => (slug ? (c.slicers.find((s) => s.slug === slug) ?? null) : null);

export interface PrinterSlicer {
  slicer: Slicer;
  link: SlicerLink;
}

const linkCovers = (link: SlicerLink, printer: Pick<PrinterModel, "slug" | "manufacturer">) =>
  link.manufacturer === printer.manufacturer && (link.printerSlugs.length === 0 || link.printerSlugs.includes(printer.slug));

/** Slicers the printer's manufacturer names for it, the manufacturer's own first. */
export function slicersForPrinter(c: Slicers, printer: Pick<PrinterModel, "slug" | "manufacturer">): PrinterSlicer[] {
  const found: PrinterSlicer[] = [];
  for (const slicer of c.slicers) {
    const link = slicer.usedBy.find((l) => linkCovers(l, printer));
    if (link) found.push({ slicer, link });
  }
  return found.sort((a, b) => Number(b.link.relation === "official") - Number(a.link.relation === "official"));
}

/** Every printer slug a slicer is linked to, given the printer library. */
export function printersForSlicer(c: Pick<SeedContent, "printers">, slicer: Slicer) {
  return c.printers
    .map((p) => ({ printer: p, link: slicer.usedBy.find((l) => linkCovers(l, p)) }))
    .filter((x): x is { printer: PrinterModel; link: SlicerLink } => x.link !== undefined);
}

export interface ResolvedSetting {
  setting: SlicerSetting;
  /** The slicer whose documentation gave the name. Differs from the chosen slicer when inherited from the project it is built on. */
  documentedBy: Slicer;
  inherited: boolean;
}

/**
 * The name and location of a setting in a slicer. When the slicer's own
 * developer does not document it, the project it is built on is used instead
 * and the result is marked as inherited, because names may have changed.
 */
export function resolveSetting(c: Slicers, slicer: Slicer, key: SlicerSettingKey): ResolvedSetting | null {
  const seen = new Set<string>();
  for (let s: Slicer | null = slicer; s && !seen.has(s.slug); s = findSlicer(c, s.basedOn)) {
    seen.add(s.slug);
    const setting = s.settings[key];
    if (setting) return { setting, documentedBy: s, inherited: s.slug !== slicer.slug };
  }
  return null;
}

/** The chain of projects a slicer is built on, nearest first. */
export function ancestry(c: Slicers, slicer: Slicer): Slicer[] {
  const chain: Slicer[] = [];
  const seen = new Set([slicer.slug]);
  for (let s = findSlicer(c, slicer.basedOn); s && !seen.has(s.slug); s = findSlicer(c, s.basedOn)) {
    chain.push(s);
    seen.add(s.slug);
  }
  return chain;
}

/** Slicers built directly on this one. */
export const derivedSlicers = (c: Slicers, slicer: Slicer) => c.slicers.filter((s) => s.basedOn === slicer.slug);
