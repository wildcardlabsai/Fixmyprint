import { PRINTER_TYPE_LABEL, type PrinterModel, type PrinterSpecs } from "@/lib/schema";

export const LEVELLING_LABEL: Record<NonNullable<PrinterSpecs["levelling"]>, string> = {
  manual: "Manual (knobs or screws)",
  "probe-offset": "Separate probe with Z offset",
  "nozzle-sensing": "Automatic, nozzle senses the bed",
  automatic: "Automatic (sensor type not published)",
};
/** Resin build plates: "manual" is paper and screws; "automatic" covers automatic and levelling-free plates. */
export const RESIN_LEVELLING_LABEL: Record<NonNullable<PrinterSpecs["levelling"]>, string> = {
  manual: "Manual (paper and plate screws)",
  "probe-offset": "Separate probe",
  "nozzle-sensing": "Sensor",
  automatic: "Automatic or levelling-free",
};
export const LEVELLING_SHORT: Record<NonNullable<PrinterSpecs["levelling"]>, string> = {
  manual: "Manual levelling",
  "probe-offset": "Probe levelling",
  "nozzle-sensing": "Nozzle-sensing levelling",
  automatic: "Automatic levelling",
};
export const EXTRUDER_LABEL: Record<NonNullable<PrinterSpecs["extruder"]>, string> = { direct: "Direct drive", bowden: "Bowden" };
export const ENCLOSURE_LABEL: Record<NonNullable<PrinterSpecs["enclosure"]>, string> = { open: "Open frame", enclosed: "Enclosed", optional: "Optional enclosure" };
export const MOTION_LABEL: Record<NonNullable<PrinterSpecs["motionSystem"]>, string> = { "bed-slinger": "Bed-slinger (bed moves in Y)", corexy: "CoreXY", delta: "Delta", other: "Other" };
export const LINEAR_LABEL: Record<NonNullable<PrinterSpecs["linearMotion"]>, string> = {
  "v-slot-wheels": "Wheels on V-slot rails",
  "smooth-rods": "Smooth rods and bearings",
  "linear-rails": "Linear rails",
  mixed: "Mixed",
};
export const FIRMWARE_LABEL: Record<NonNullable<PrinterSpecs["firmwareFamily"]>, string> = {
  marlin: "Marlin-based",
  klipper: "Klipper-based",
  prusa: "Prusa firmware",
  bambu: "Bambu Lab firmware",
  other: "Other",
};

export const UNKNOWN = "Not yet verified";

const plain = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Joins a label and its detail, dropping the detail when it only repeats the label. */
export function withDetail(label: string, detail: string | null | undefined): string {
  if (!detail || plain(label).includes(plain(detail))) return label;
  if (plain(detail).includes(plain(label))) return detail;
  return `${label}. ${detail}`;
}

/** Rows for a specification table. Unknown values are shown as unknown, never guessed. */
export function specRows(p: PrinterModel, filamentName: (slug: string) => string): { label: string; value: string | null }[] {
  const s = p.specs;
  if (s.printerType === "msla") {
    const r = s.resin;
    return [
      { label: "Printer type", value: PRINTER_TYPE_LABEL.msla },
      { label: "Build volume", value: s.buildVolumeMm ? `${s.buildVolumeMm.x} × ${s.buildVolumeMm.y} × ${s.buildVolumeMm.z} mm` : null },
      { label: "Screen", value: r?.lcd ?? null },
      { label: "XY resolution", value: r?.xyResolution ?? null },
      { label: "Layer height", value: r?.layerHeightMm ? `${r.layerHeightMm.min}–${r.layerHeightMm.max} mm` : null },
      { label: "Light source", value: r?.lightSource ?? null },
      { label: "Build plate levelling", value: s.levelling ? withDetail(RESIN_LEVELLING_LABEL[s.levelling], s.levellingDetail) : null },
      { label: "Connectivity", value: s.connectivity.length ? s.connectivity.join(", ") : null },
    ];
  }
  return [
    { label: "Printer type", value: PRINTER_TYPE_LABEL.fdm },
    { label: "Motion system", value: s.motionSystem ? MOTION_LABEL[s.motionSystem] : null },
    { label: "Linear motion", value: s.linearMotion ? LINEAR_LABEL[s.linearMotion] : null },
    { label: "Build volume", value: s.buildVolumeMm ? `${s.buildVolumeMm.x} × ${s.buildVolumeMm.y} × ${s.buildVolumeMm.z} mm` : null },
    { label: "Maximum hotend temperature", value: s.hotendMaxTempC ? `${s.hotendMaxTempC} °C` : null },
    { label: "Heated bed", value: s.bed ? (s.bed.heated ? (s.bed.maxTempC ? `Yes, up to ${s.bed.maxTempC} °C` : "Yes") : "No") : null },
    { label: "Build surface", value: s.bed?.surface ?? null },
    { label: "Enclosure", value: s.enclosure ? ENCLOSURE_LABEL[s.enclosure] : null },
    { label: "Bed levelling", value: s.levelling ? withDetail(LEVELLING_LABEL[s.levelling], s.levellingDetail) : null },
    { label: "Extruder", value: s.extruder ? withDetail(EXTRUDER_LABEL[s.extruder], s.extruderDetail) : null },
    {
      label: "Nozzle",
      value: s.nozzle ? [s.nozzle.stockDiameterMm ? `${s.nozzle.stockDiameterMm} mm as standard` : null, s.nozzle.system, s.nozzle.notes].filter(Boolean).join(". ") || null : null,
    },
    {
      label: "Multi-material",
      value: s.multiMaterial.length
        ? s.multiMaterial.map((m) => `${m.name} (${m.kind === "built-in" ? "built in" : "optional add-on"}${m.slots ? `, ${m.slots} slots` : ""})`).join("; ")
        : null,
    },
    { label: "Firmware", value: s.firmwareFamily ? withDetail(FIRMWARE_LABEL[s.firmwareFamily], s.firmwareDetail) : null },
    { label: "Connectivity", value: s.connectivity.length ? s.connectivity.join(", ") : null },
    { label: "Manufacturer-listed materials", value: s.supportedFilaments.length ? s.supportedFilaments.map(filamentName).join(", ") : null },
  ];
}

/**
 * The recorded specifications that diagnoses and guides rely on, labelled for
 * display. Only values the manufacturer publishes are listed.
 */
export function specFactsUsed(p: PrinterModel): { label: string; value: string }[] {
  const s = p.specs;
  const resin = s.printerType === "msla";
  const rows: [string, string | null][] = [
    ["Printing technology", PRINTER_TYPE_LABEL[s.printerType]],
    [resin ? "Build plate levelling" : "Bed levelling", s.levelling ? (resin ? RESIN_LEVELLING_LABEL : LEVELLING_LABEL)[s.levelling] : null],
    ["Extruder", !resin && s.extruder ? EXTRUDER_LABEL[s.extruder] : null],
    ["Enclosure", !resin && s.enclosure ? ENCLOSURE_LABEL[s.enclosure] : null],
    ["Build surface", !resin ? (s.bed?.surface ?? null) : null],
    ["Firmware", !resin && s.firmwareFamily ? FIRMWARE_LABEL[s.firmwareFamily] : null],
  ];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, value]) => ({ label, value }));
}
