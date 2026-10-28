import { z } from "zod";
import { linkSchema, slugSchema, verificationSchema, isoDateSchema } from "./common";

export const manufacturerSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  website: z.url().nullable(),
  supportUrl: z.url().nullable(),
  aliases: z.array(z.string()).default([]),
});
export type Manufacturer = z.infer<typeof manufacturerSchema>;

/** How the printer establishes the nozzle-to-bed distance. Drives which levelling advice applies. */
export const levellingSchema = z.enum([
  "manual", // adjustment knobs or screws, no sensor
  "probe-offset", // separate probe (inductive, BLTouch-style) with a user-set Z offset
  "nozzle-sensing", // the nozzle itself touches the bed (load cell, strain gauge, force sensor)
]);
export type Levelling = z.infer<typeof levellingSchema>;

export const printerTypeSchema = z.enum(["fdm"]);
export const motionSystemSchema = z.enum(["bed-slinger", "corexy", "delta", "other"]);
export const extruderSchema = z.enum(["direct", "bowden"]);
export const enclosureSchema = z.enum(["open", "enclosed", "optional"]);
export const firmwareFamilySchema = z.enum(["marlin", "klipper", "prusa", "bambu", "other"]);
export const linearMotionSchema = z.enum(["v-slot-wheels", "smooth-rods", "linear-rails", "mixed"]);

export const multiMaterialSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["built-in", "optional-add-on"]),
  slots: z.number().int().positive().nullable(),
  notes: z.string().optional(),
});

/**
 * Specifications. Every field is nullable: null means "not yet verified", and the
 * interface shows it as unknown rather than guessing.
 */
export const printerSpecsSchema = z.object({
  printerType: printerTypeSchema,
  motionSystem: motionSystemSchema.nullable(),
  linearMotion: linearMotionSchema.nullable(),
  buildVolumeMm: z.object({ x: z.number(), y: z.number(), z: z.number() }).nullable(),
  hotendMaxTempC: z.number().int().positive().nullable(),
  bed: z
    .object({
      heated: z.boolean(),
      maxTempC: z.number().int().positive().nullable(),
      surface: z.string().nullable(),
      surfaceKind: z.enum(["glass", "smooth-pei", "textured-pei", "coated-steel", "other"]).nullable(),
    })
    .nullable(),
  enclosure: enclosureSchema.nullable(),
  levelling: levellingSchema.nullable(),
  levellingDetail: z.string().nullable(),
  extruder: extruderSchema.nullable(),
  extruderDetail: z.string().nullable(),
  nozzle: z
    .object({
      stockDiameterMm: z.number().positive().nullable(),
      system: z.string().nullable(),
      notes: z.string().optional(),
    })
    .nullable(),
  multiMaterial: z.array(multiMaterialSchema).default([]),
  firmwareFamily: firmwareFamilySchema.nullable(),
  firmwareDetail: z.string().nullable(),
  connectivity: z.array(z.string()).default([]),
  supportedFilaments: z.array(slugSchema).default([]),
});
export type PrinterSpecs = z.infer<typeof printerSpecsSchema>;

export const printerVariantSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  kind: z.enum(["hardware-revision", "bundle", "regional", "other"]),
  description: z.string().min(1),
  /** Spec overrides that apply to this variant only. */
  specOverrides: printerSpecsSchema.partial().default({}),
});
export type PrinterVariant = z.infer<typeof printerVariantSchema>;

export const printerNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  symptomSlugs: z.array(slugSchema).default([]),
  guideSlugs: z.array(slugSchema).default([]),
});

export const printerModelSchema = z.object({
  slug: slugSchema,
  manufacturer: slugSchema,
  name: z.string().min(1),
  family: z.string().nullable(),
  aliases: z.array(z.string()).default([]),
  summary: z.string().min(1),
  specs: printerSpecsSchema,
  variants: z.array(printerVariantSchema).default([]),
  troubleshootingNotes: z.array(printerNoteSchema).default([]),
  documentation: z.array(linkSchema).default([]),
  sourceIds: z.array(slugSchema).min(1),
  confidenceNotes: z.string().min(1),
  lastVerified: isoDateSchema.nullable(),
  verification: verificationSchema,
});
export type PrinterModel = z.infer<typeof printerModelSchema>;
