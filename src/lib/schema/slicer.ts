import { z } from "zod";
import { isoDateSchema, linkSchema, slugSchema, verificationSchema } from "./common";

/**
 * Settings that troubleshooting advice refers to. Each slicer names and places
 * them differently, so advice points at the key and the slicer supplies the name.
 */
export const slicerSettingKeySchema = z.enum([
  "retraction",
  "wipe",
  "avoid-crossing",
  "seam",
  "flow",
  "elephant-foot",
  "pressure-advance",
  "brim",
  "first-layer-speed",
]);
export type SlicerSettingKey = z.infer<typeof slicerSettingKeySchema>;

export const SLICER_SETTING_LABELS: Record<SlicerSettingKey, { label: string; purpose: string }> = {
  retraction: { label: "Retraction distance", purpose: "How far filament is pulled back before a travel move." },
  wipe: { label: "Wipe while retracting", purpose: "Moves the nozzle along the wall while retracting to clean off ooze." },
  "avoid-crossing": { label: "Avoid crossing walls on travel", purpose: "Keeps travel moves inside the part where possible." },
  seam: { label: "Seam position", purpose: "Where each layer starts and ends." },
  flow: { label: "Flow / extrusion multiplier", purpose: "Fine adjustment of how much plastic is extruded." },
  "elephant-foot": { label: "Elephant's foot compensation", purpose: "Shrinks the first layers to counter flaring at the base." },
  "pressure-advance": { label: "Pressure advance", purpose: "Compensates for nozzle pressure at corners and speed changes." },
  brim: { label: "Brim", purpose: "Extra lines around the base to hold corners down." },
  "first-layer-speed": { label: "First layer speed", purpose: "Slower first layer for better adhesion." },
};

export const slicerSettingSchema = z.object({
  /** The name exactly as it appears in the slicer. */
  name: z.string().min(1),
  /** Where to find it, e.g. "Printer Settings > Extruder 1 > Retraction". */
  location: z.string().optional(),
  note: z.string().optional(),
  sourceUrl: z.url(),
});
export type SlicerSetting = z.infer<typeof slicerSettingSchema>;

/**
 * A manufacturer statement linking a slicer to its printers. An empty
 * printerSlugs list means every model from that manufacturer in the library.
 */
export const slicerLinkSchema = z.object({
  manufacturer: slugSchema,
  printerSlugs: z.array(slugSchema).default([]),
  /** official: the manufacturer's own slicer. supported: the manufacturer names it or publishes profiles for it. */
  relation: z.enum(["official", "supported"]),
  note: z.string().optional(),
  sourceUrl: z.url(),
});
export type SlicerLink = z.infer<typeof slicerLinkSchema>;

export const slicerSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  developer: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  formerNames: z.array(z.string()).default([]),
  /** The slicer it was forked from or built on, when the developer states it. */
  basedOn: slugSchema.nullable(),
  lineage: z.string().optional(),
  openSource: z.boolean().nullable(),
  licence: z.string().nullable(),
  platforms: z.array(z.enum(["windows", "macos", "linux"])).default([]),
  url: z.url(),
  summary: z.string().min(1),
  settings: z.partialRecord(slicerSettingKeySchema, slicerSettingSchema).default({}),
  calibrationTools: z.array(z.object({ name: z.string().min(1), sourceUrl: z.url() })).default([]),
  notes: z.array(z.string()).default([]),
  usedBy: z.array(slicerLinkSchema).default([]),
  sources: z.array(linkSchema.extend({ accessed: isoDateSchema })).min(1),
  verification: verificationSchema,
});
export type Slicer = z.infer<typeof slicerSchema>;
export type SlicerInput = z.input<typeof slicerSchema>;
