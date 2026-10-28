import type { Filament, PrinterModel } from "@/lib/schema";

export type CompatLevel = "ok" | "caution" | "blocker" | "unknown";

export interface CompatNote {
  topic: string;
  level: CompatLevel;
  message: string;
}

/**
 * Compares a material's general requirements with what a printer's verified
 * specifications say it can do. Missing specifications produce "unknown",
 * never a guess.
 */
export function checkFilamentCompatibility(f: Filament, p: PrinterModel): CompatNote[] {
  const s = p.specs;
  const notes: CompatNote[] = [];

  const hot = s.hotendMaxTempC;
  if (hot === null) notes.push({ topic: "Nozzle temperature", level: "unknown", message: "This printer's maximum hotend temperature has not been verified." });
  else if (hot < f.nozzleTempC.min)
    notes.push({ topic: "Nozzle temperature", level: "blocker", message: `${f.name} needs at least ${f.nozzleTempC.min} °C; this printer's hotend is rated to ${hot} °C.` });
  else if (hot < f.nozzleTempC.max)
    notes.push({ topic: "Nozzle temperature", level: "caution", message: `Rated to ${hot} °C, so only the lower part of the ${f.nozzleTempC.min}–${f.nozzleTempC.max} °C range is available.` });
  else notes.push({ topic: "Nozzle temperature", level: "ok", message: `Rated to ${hot} °C, which covers the general range.` });

  if (f.bedTempC) {
    const bed = s.bed;
    if (!bed || (bed.heated && bed.maxTempC === null))
      notes.push({ topic: "Bed temperature", level: "unknown", message: "This printer's maximum bed temperature has not been verified." });
    else if (!bed.heated) notes.push({ topic: "Bed temperature", level: "blocker", message: `${f.name} needs a heated bed.` });
    else if (bed.maxTempC! < f.bedTempC.min)
      notes.push({ topic: "Bed temperature", level: "blocker", message: `${f.name} usually needs ${f.bedTempC.min} °C or more; this bed is rated to ${bed.maxTempC} °C.` });
    else if (bed.maxTempC! < f.bedTempC.max)
      notes.push({ topic: "Bed temperature", level: "caution", message: `Bed rated to ${bed.maxTempC} °C, the lower part of the ${f.bedTempC.min}–${f.bedTempC.max} °C range.` });
    else notes.push({ topic: "Bed temperature", level: "ok", message: `Bed rated to ${bed.maxTempC} °C, which covers the general range.` });
  }

  if (f.enclosure === "required" || f.enclosure === "recommended") {
    const needs = f.enclosure === "required" ? "needs" : "usually needs";
    if (s.enclosure === null) notes.push({ topic: "Enclosure", level: "unknown", message: `${f.name} ${needs} an enclosure; whether this printer has one is not recorded.` });
    else if (s.enclosure === "open")
      notes.push({ topic: "Enclosure", level: f.enclosure === "required" ? "blocker" : "caution", message: `${f.name} ${needs} an enclosure and this printer is open-framed.` });
    else if (s.enclosure === "optional") notes.push({ topic: "Enclosure", level: "caution", message: `${f.name} ${needs} an enclosure. One is available for this printer as an option.` });
    else notes.push({ topic: "Enclosure", level: "ok", message: "This printer is enclosed." });
  }

  if (f.requiresHardenedNozzle) {
    notes.push({ topic: "Nozzle", level: "caution", message: `${f.name} is abrasive. Fit a hardened or wear-resistant nozzle first; standard nozzles are usually brass.` });
  }

  if (f.directDrivePreferred) {
    if (s.extruder === null) notes.push({ topic: "Extruder", level: "unknown", message: "Easier on direct-drive extruders; this printer's extruder type is not recorded." });
    else if (s.extruder === "bowden") notes.push({ topic: "Extruder", level: "caution", message: "Harder on a Bowden extruder: print slowly, and some grades may not be practical." });
    else notes.push({ topic: "Extruder", level: "ok", message: "Direct-drive extruder." });
  }

  if (s.supportedFilaments.length > 0 && !s.supportedFilaments.includes(f.slug)) {
    notes.push({ topic: "Manufacturer list", level: "caution", message: `${f.name} is not in the manufacturer's list of materials for this printer.` });
  }

  return notes;
}

export function overall(notes: CompatNote[]): CompatLevel {
  if (notes.some((n) => n.level === "blocker")) return "blocker";
  if (notes.some((n) => n.level === "caution")) return "caution";
  if (notes.some((n) => n.level === "unknown")) return "unknown";
  return "ok";
}
