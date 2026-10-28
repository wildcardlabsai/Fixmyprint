import { z } from "zod";

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugs must be lowercase words separated by hyphens");

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be YYYY-MM-DD");

/**
 * Review status of any piece of content.
 *
 * - draft: incomplete, never shown publicly.
 * - unreviewed: complete and published, but not yet checked by a second person.
 * - reviewed: checked by an editor against the cited sources.
 * - verified: checked against primary sources and, where relevant, tested on hardware.
 *
 * Seeded content starts as "unreviewed". Nothing becomes "verified" because it was generated or seeded.
 */
export const reviewStatusSchema = z.enum(["draft", "unreviewed", "reviewed", "verified"]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const verificationSchema = z.object({
  status: reviewStatusSchema,
  author: z.string().min(1),
  reviewedBy: z.string().nullable(),
  lastReviewed: isoDateSchema.nullable(),
  notes: z.string().optional(),
  knownLimitations: z.array(z.string()).default([]),
});
export type Verification = z.infer<typeof verificationSchema>;

export const sourceKindSchema = z.enum([
  "manufacturer-docs",
  "manufacturer-site",
  "firmware-docs",
  "standards",
  "editorial",
]);

export const sourceReferenceSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url().optional(),
  kind: sourceKindSchema,
  note: z.string().optional(),
});
export type SourceReference = z.infer<typeof sourceReferenceSchema>;

export const safetyIdSchema = z.enum([
  "hot-surfaces",
  "moving-parts",
  "mains-electrical",
  "power-off-before-work",
  "never-bypass-protection",
  "fumes-ventilation",
  "sharp-tools",
  "solvents",
  "firmware-flashing",
  "resin-handling",
]);
export type SafetyId = z.infer<typeof safetyIdSchema>;

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});
export type Link = z.infer<typeof linkSchema>;

export const rangeSchema = z
  .object({ min: z.number(), max: z.number() })
  .refine((r) => r.min <= r.max, "Range minimum must not exceed maximum");
export type Range = z.infer<typeof rangeSchema>;
