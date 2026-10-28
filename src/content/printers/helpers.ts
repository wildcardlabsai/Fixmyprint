import type { Link, PrinterModel, PrinterSpecs } from "@/lib/schema";
import { seedVerification } from "../shared";

/** Date the specifications below were taken from the manufacturers' pages. */
export const ACCESSED = "2026-10-28";

const unknownSpecs: PrinterSpecs = {
  printerType: "fdm",
  motionSystem: null,
  linearMotion: null,
  buildVolumeMm: null,
  hotendMaxTempC: null,
  bed: null,
  enclosure: null,
  levelling: null,
  levellingDetail: null,
  extruder: null,
  extruderDetail: null,
  nozzle: null,
  multiMaterial: [],
  firmwareFamily: null,
  firmwareDetail: null,
  connectivity: [],
  supportedFilaments: [],
  resin: null,
};

export const volume = (x: number, y: number, z: number) => ({ x, y, z });

export const bed = (maxTempC: number | null, surface: string | null = null, surfaceKind: NonNullable<PrinterSpecs["bed"]>["surfaceKind"] = null) => ({
  heated: true,
  maxTempC,
  surface,
  surfaceKind,
});

interface PrinterInput {
  slug: string;
  manufacturer: string;
  name: string;
  family?: string | null;
  aliases?: string[];
  summary: string;
  specs: Partial<PrinterSpecs>;
  /** Manufacturer pages the specifications came from. */
  sources: Link[];
  /** Conflicts or gaps in the manufacturer's own figures, shown to readers. */
  gaps?: string[];
  sourceId: string;
  variants?: PrinterModel["variants"];
  troubleshootingNotes?: PrinterModel["troubleshootingNotes"];
}

/**
 * Builds a printer record. Specifications come only from the listed manufacturer
 * pages; anything they do not state, or state inconsistently, is left null.
 */
export function printer(p: PrinterInput): PrinterModel {
  const gapText = p.gaps?.length ? ` ${p.gaps.join(" ")}` : "";
  return {
    slug: p.slug,
    manufacturer: p.manufacturer,
    name: p.name,
    family: p.family ?? null,
    aliases: p.aliases ?? [],
    summary: p.summary,
    specs: { ...unknownSpecs, ...p.specs },
    variants: p.variants ?? [],
    troubleshootingNotes: p.troubleshootingNotes ?? [],
    documentation: p.sources,
    sourceIds: [p.sourceId],
    specSources: p.sources.map((s) => ({ ...s, accessed: ACCESSED })),
    confidenceNotes: `Specifications are taken from the manufacturer's own published pages listed below. Anything those pages do not state, or state inconsistently, is left blank rather than guessed.${gapText} Not yet reviewed by a second person.`,
    lastVerified: null,
    verification: seedVerification(undefined, p.gaps ?? []),
  };
}
