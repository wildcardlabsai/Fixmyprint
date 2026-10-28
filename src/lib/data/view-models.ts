import type { SeedContent } from "@/content";
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
