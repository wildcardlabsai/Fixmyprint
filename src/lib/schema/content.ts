import { z } from "zod";
import { conditionSchema, factKeySchema } from "./condition";
import { slicerSettingKeySchema } from "./slicer";
import { rangeSchema, safetyIdSchema, slugSchema, verificationSchema } from "./common";

/* Symptoms and categories ------------------------------------------------- */

export const symptomCategorySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
});
export type SymptomCategory = z.infer<typeof symptomCategorySchema>;

export const symptomSchema = z.object({
  slug: slugSchema,
  category: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  /** Other words people use for this problem. Used by search. */
  synonyms: z.array(z.string()).default([]),
  flowId: z.string().nullable(),
  guideSlugs: z.array(slugSchema).default([]),
  common: z.boolean().default(false),
});
export type Symptom = z.infer<typeof symptomSchema>;

/* Error codes -------------------------------------------------------------- */

export const errorCodeSchema = z.object({
  slug: slugSchema,
  message: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  firmwareFamily: z.enum(["marlin", "klipper", "prusa", "bambu", "other"]),
  firmwareLabel: z.string().min(1),
  meaning: z.string().min(1),
  firstSteps: z.array(z.string()).min(1),
  flowId: z.string().nullable(),
  safety: z.array(safetyIdSchema).default([]),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/* Repair guides ------------------------------------------------------------ */

export const guideStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  appliesWhen: conditionSchema.optional(),
  /** Shown when the printer is unknown, e.g. "Printers with a separate probe". */
  appliesLabel: z.string().optional(),
  warning: z.string().optional(),
  tip: z.string().optional(),
  safety: z.array(safetyIdSchema).default([]),
  diagram: z.enum(["first-layer-height", "bowden-coupler"]).optional(),
});
export type GuideStep = z.infer<typeof guideStepSchema>;

export const hardwareSelectorSchema = z.object({
  fact: factKeySchema,
  prompt: z.string().min(1),
  options: z.array(z.object({ value: z.string(), label: z.string(), detail: z.string().optional() })).min(2),
});
export type HardwareSelector = z.infer<typeof hardwareSelectorSchema>;

export const guideSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  problem: z.string().min(1),
  category: slugSchema,
  symptomSlugs: z.array(slugSchema).default([]),
  /** Empty means the guide is general and applies to most FDM printers, subject to step conditions. */
  printerSlugs: z.array(slugSchema).default([]),
  appliesNote: z.string().min(1),
  /** Hardware the whole guide applies to. Hidden from recommendations when definitely false. */
  appliesWhen: conditionSchema.optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  timeMinutes: rangeSchema.nullable(),
  tools: z.array(z.string()).default([]),
  parts: z.array(z.object({ name: z.string(), partSlug: slugSchema.optional(), optional: z.boolean().default(false) })).default([]),
  safety: z.array(safetyIdSchema).default([]),
  hardwareSelector: hardwareSelectorSchema.optional(),
  steps: z.array(guideStepSchema).min(1),
  settings: z.array(z.object({ name: z.string(), value: z.string(), note: z.string().optional() })).default([]),
  /** Slicer settings this guide adjusts. Shown with each slicer's own names. */
  slicerSettings: z.array(slicerSettingKeySchema).default([]),
  expectedResult: z.string().min(1),
  verificationSteps: z.array(z.string()).min(1),
  ifFails: z.object({
    text: z.string().min(1),
    flowId: z.string().optional(),
    guideSlugs: z.array(slugSchema).default([]),
    escalation: z.string().optional(),
  }),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type Guide = z.infer<typeof guideSchema>;

/* Filament ----------------------------------------------------------------- */

export const filamentSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  fullName: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  group: z.enum(["standard", "engineering", "flexible", "reinforced"]),
  summary: z.string().min(1),
  nozzleTempC: rangeSchema,
  bedTempC: rangeSchema.nullable(),
  coolingFanPercent: rangeSchema,
  enclosure: z.enum(["not-needed", "helpful", "recommended", "required"]),
  moisture: z.enum(["low", "moderate", "high", "very-high"]),
  drying: z.object({ tempC: rangeSchema, hours: rangeSchema }).nullable(),
  abrasive: z.boolean(),
  requiresHardenedNozzle: z.boolean(),
  directDrivePreferred: z.boolean(),
  bedSurfaceNotes: z.string().min(1),
  printingNotes: z.array(z.string()).default([]),
  safetyNotes: z.array(z.string()).default([]),
  safety: z.array(safetyIdSchema).default([]),
  /** Manufacturer-specific profiles. Empty until real data sheets have been reviewed. */
  manufacturerProfiles: z
    .array(
      z.object({
        brand: z.string(),
        product: z.string(),
        nozzleTempC: rangeSchema.nullable(),
        bedTempC: rangeSchema.nullable(),
        sourceUrl: z.url(),
      }),
    )
    .default([]),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type Filament = z.infer<typeof filamentSchema>;

/* Maintenance -------------------------------------------------------------- */

export const maintenanceTaskSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  area: z.enum(["build-surface", "motion", "extrusion", "electrical", "firmware", "frame"]),
  interval: z.object({
    label: z.string().min(1),
    /** Rough ordering value in print hours, used only for sorting. */
    sortHours: z.number().nonnegative(),
  }),
  appliesWhen: conditionSchema.optional(),
  appliesLabel: z.string().optional(),
  tools: z.array(z.string()).default([]),
  steps: z.array(z.string().min(1)).min(1),
  cautions: z.array(z.string()).default([]),
  safety: z.array(safetyIdSchema).default([]),
  guideSlugs: z.array(slugSchema).default([]),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type MaintenanceTask = z.infer<typeof maintenanceTaskSchema>;

/* Parts -------------------------------------------------------------------- */

export const partSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  category: z.enum(["nozzle", "hotend", "extruder", "build-surface", "motion", "tubing", "electronics", "other"]),
  description: z.string().min(1),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  compatibility: z
    .array(
      z.object({
        printerSlug: slugSchema,
        status: z.enum(["manufacturer-listed", "reported", "unverified"]),
        note: z.string().optional(),
      }),
    )
    .min(1),
  replacementGuideSlug: slugSchema.optional(),
  supplier: z
    .object({ label: z.string(), url: z.url(), kind: z.enum(["manufacturer-store", "manufacturer-docs"]) })
    .nullable(),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type Part = z.infer<typeof partSchema>;

/* Safety notices ----------------------------------------------------------- */

export const safetyNoticeSchema = z.object({
  id: safetyIdSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  level: z.enum(["caution", "warning", "danger"]),
});
export type SafetyNotice = z.infer<typeof safetyNoticeSchema>;

/* Authoring types: fields with defaults may be omitted in content files. */
export type SymptomInput = z.input<typeof symptomSchema>;
export type ErrorCodeInput = z.input<typeof errorCodeSchema>;
export type GuideInput = z.input<typeof guideSchema>;
export type FilamentInput = z.input<typeof filamentSchema>;
export type MaintenanceTaskInput = z.input<typeof maintenanceTaskSchema>;
export type PartInput = z.input<typeof partSchema>;
