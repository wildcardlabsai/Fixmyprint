import type { SeedContent } from "@/content";

/**
 * Homepage claims that depend on what the content actually covers. The
 * preferred wording is used only when the data supports it; otherwise an
 * accurate alternative is shown, so the page never claims more than we have.
 */

type Content = Pick<SeedContent, "printers" | "manufacturers" | "guides" | "slicers">;

export interface Benefit {
  icon: "brands" | "steps" | "data" | "slicer" | "printer-types";
  title: string;
  text: string;
}

const RESIN_TYPES = new Set(["msla", "resin", "sla", "dlp"]);

export function coverage(c: Content) {
  const brands = c.manufacturers.filter((m) => c.printers.some((p) => p.manufacturer === m.slug)).length;
  const types = new Set<string>(c.printers.map((p) => p.specs.printerType));
  const hasResin = [...types].some((t) => RESIN_TYPES.has(t));
  const hasFdm = types.has("fdm");
  const illustratedGuides = c.guides.filter((g) => g.steps.some((s) => s.diagram)).length;
  return { brands, models: c.printers.length, hasResin, hasFdm, allGuidesIllustrated: c.guides.length > 0 && illustratedGuides === c.guides.length };
}

export function heroEyebrow(c: Content): string {
  const cov = coverage(c);
  const types = cov.hasFdm && cov.hasResin ? "FDM & MSLA RESIN SUPPORT" : cov.hasResin ? "MSLA RESIN SUPPORT" : "FDM PRINTER SUPPORT";
  // "All major brands" cannot be confirmed from the data, so the brand count is shown instead.
  return `${types} · ${cov.brands} MAJOR BRANDS`;
}

export function benefits(c: Content): Benefit[] {
  const cov = coverage(c);
  const slicerNames = c.slicers
    .map((s) => s.name)
    .filter((n) => ["OrcaSlicer", "Bambu Studio", "PrusaSlicer"].includes(n));
  return [
    { icon: "brands", title: `${cov.brands} major brands`, text: "Find supported models from leading manufacturers." },
    {
      icon: "steps",
      title: "Step-by-step fixes",
      text: cov.allGuidesIllustrated ? "Follow practical, illustrated repair instructions." : "Follow practical repair instructions, one step at a time.",
    },
    { icon: "data", title: "Real technical data", text: "Use sourced, model-specific specifications and maintenance guidance." },
    {
      icon: "slicer",
      title: "Your slicer's settings",
      text: `See what each setting is called in ${slicerNames.length ? `${slicerNames.join(", ")} and ${c.slicers.length - slicerNames.length} more slicers` : "your slicer"}.`,
    },
    cov.hasFdm && cov.hasResin
      ? { icon: "printer-types", title: "FDM & MSLA support", text: "Troubleshooting for filament and resin printers." }
      : { icon: "printer-types", title: "FDM printers", text: "Troubleshooting for filament printers. Resin printers are not covered yet." },
  ];
}
