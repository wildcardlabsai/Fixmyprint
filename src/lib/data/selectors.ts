import type { SeedContent } from "@/content";
import type { Guide, Manufacturer, PrinterModel } from "@/lib/schema";

/** Pure lookups over content. Safe on server and client. */

export const findPrinter = (c: Pick<SeedContent, "printers">, slug: string | null | undefined) =>
  slug ? (c.printers.find((p) => p.slug === slug) ?? null) : null;

export const findManufacturer = (c: Pick<SeedContent, "manufacturers">, slug: string) =>
  c.manufacturers.find((m) => m.slug === slug) ?? null;

export interface ManufacturerWithCount extends Manufacturer {
  modelCount: number;
}

/** Counts come only from the records actually in the database. */
export function manufacturersWithCounts(c: Pick<SeedContent, "manufacturers" | "printers">): ManufacturerWithCount[] {
  return c.manufacturers
    .map((m) => ({ ...m, modelCount: c.printers.filter((p) => p.manufacturer === m.slug).length }))
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name));
}

export const printerDisplayName = (c: Pick<SeedContent, "manufacturers">, p: PrinterModel) => {
  const m = findManufacturer(c, p.manufacturer);
  // Avoid "Prusa Research Original Prusa MK4".
  return m && !p.name.toLowerCase().includes(m.name.split(" ")[0]!.toLowerCase()) ? `${m.name} ${p.name}` : p.name;
};

export function sortedPrinters(c: Pick<SeedContent, "manufacturers" | "printers">): PrinterModel[] {
  const name = (p: PrinterModel) => findManufacturer(c, p.manufacturer)?.name ?? p.manufacturer;
  return [...c.printers].sort((a, b) => name(a).localeCompare(name(b)) || a.name.localeCompare(b.name));
}

export const findGuide = (c: Pick<SeedContent, "guides">, slug: string) => c.guides.find((g) => g.slug === slug) ?? null;
export const findFlow = (c: Pick<SeedContent, "flows">, id: string) => c.flows.find((f) => f.id === id) ?? null;

export function guidesFor(c: Pick<SeedContent, "guides">, slugs: string[]): Guide[] {
  return slugs.map((s) => findGuide(c, s)).filter((g): g is Guide => g !== null);
}

/** Guides that mention a printer explicitly, plus general guides for its printing technology. */
export function guidesForPrinter(c: Pick<SeedContent, "guides" | "printers">, slug: string) {
  const type = c.printers.find((p) => p.slug === slug)?.specs.printerType;
  return {
    specific: c.guides.filter((g) => g.printerSlugs.includes(slug)),
    general: c.guides.filter((g) => g.printerSlugs.length === 0 && (!type || g.printerTypes.includes(type))),
  };
}

export const errorCodesForFirmware = (c: Pick<SeedContent, "errorCodes">, family: string | null) =>
  family ? c.errorCodes.filter((e) => e.firmwareFamily === family || (family === "prusa" && e.firmwareFamily === "marlin")) : [];
