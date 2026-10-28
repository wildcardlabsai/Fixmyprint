import type { SeedContent } from "@/content";
import { slicersForPrinter } from "@/lib/slicers";
import { manufacturersWithCounts, printerDisplayName, sortedPrinters } from "./selectors";

/** Small, serialisable printer summaries for client components. */
export interface PrinterOption {
  slug: string;
  name: string;
  displayName: string;
  manufacturerSlug: string;
  manufacturerName: string;
  aliases: string[];
  summary: string;
}

export interface ManufacturerOption {
  slug: string;
  name: string;
  modelCount: number;
}

export function printerOptions(c: SeedContent): PrinterOption[] {
  return sortedPrinters(c).map((p) => {
    const m = c.manufacturers.find((x) => x.slug === p.manufacturer);
    return {
      slug: p.slug,
      name: p.name,
      displayName: printerDisplayName(c, p),
      manufacturerSlug: p.manufacturer,
      manufacturerName: m?.name ?? p.manufacturer,
      aliases: [...p.aliases, ...(m?.aliases ?? [])],
      summary: p.summary,
    };
  });
}

export function manufacturerOptions(c: SeedContent): ManufacturerOption[] {
  return manufacturersWithCounts(c).map((m) => ({ slug: m.slug, name: m.name, modelCount: m.modelCount }));
}

export interface SlicerOption {
  slug: string;
  name: string;
}

/** A slicer named for a printer, with whether it is the manufacturer's own. */
export interface SlicerChoice {
  slug: string;
  official: boolean;
}

export const slicerOptions = (c: SeedContent): SlicerOption[] =>
  [...c.slicers].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ slug: s.slug, name: s.name }));

/** Slicers each printer's manufacturer names for it, official first. Small enough to send to every page. */
export function slicerChoicesByPrinter(c: SeedContent): Record<string, SlicerChoice[]> {
  return Object.fromEntries(
    c.printers.map((p) => [p.slug, slicersForPrinter(c, p).map(({ slicer, link }) => ({ slug: slicer.slug, official: link.relation === "official" }))]),
  );
}
