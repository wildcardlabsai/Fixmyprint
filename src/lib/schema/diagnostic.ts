import { z } from "zod";
import { slicerSettingKeySchema } from "./slicer";
import { conditionSchema, factKeySchema } from "./condition";
import { safetyIdSchema, slugSchema, verificationSchema } from "./common";

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "IDs must be lowercase and hyphenated");

/** Score contribution from an answer to an outcome. Positive supports, negative counts against. */
export const evidenceSchema = z.record(idSchema, z.number().int().min(-10).max(10));
export type Evidence = z.infer<typeof evidenceSchema>;

export const RESULT = "result" as const;

export const nextSchema = z.union([
  idSchema, // a question id, or "result"
  z.object({
    branch: z.array(z.object({ when: conditionSchema, goto: idSchema })).min(1),
    otherwise: idSchema,
  }),
]);
export type Next = z.infer<typeof nextSchema>;

export const answerOptionSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  detail: z.string().optional(),
  next: nextSchema,
  evidence: evidenceSchema.default({}),
  /** Facts this answer establishes, for example { filament: "petg" }. */
  facts: z.partialRecord(factKeySchema, z.string()).default({}),
  /** "Not sure" or "something else": the engine treats this as weak information. */
  uncertain: z.boolean().default(false),
});
export type AnswerOption = z.infer<typeof answerOptionSchema>;

export const questionSchema = z.object({
  id: idSchema,
  prompt: z.string().min(1),
  why: z.string().min(1),
  help: z.string().optional(),
  options: z.array(answerOptionSchema).min(2),
  /**
   * When the fact is known (usually from the selected printer) and maps to an
   * option, that option is applied automatically and the question is not shown.
   */
  autoAnswer: z
    .object({ fact: factKeySchema, map: z.record(z.string(), idSchema) })
    .optional(),
  /** Skip the question entirely when this condition is definitely true. */
  skipWhen: conditionSchema.optional(),
  /** Where to go when skipped via skipWhen. */
  skipTo: idSchema.optional(),
  safety: z.array(safetyIdSchema).default([]),
});
export type Question = z.infer<typeof questionSchema>;

/** A recommended check; hardware-specific checks carry a condition and are hidden when it is definitely false. */
export const checkSchema = z.union([z.string().min(1), z.object({ text: z.string().min(1), when: conditionSchema })]);
export type Check = z.infer<typeof checkSchema>;

export const outcomeSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  explanation: z.string().min(1),
  checks: z.array(checkSchema).min(1),
  guideSlugs: z.array(slugSchema).default([]),
  /** Slicer settings to adjust for this cause. Each slicer supplies its own name for them. */
  slicerSettings: z.array(slicerSettingKeySchema).default([]),
  safety: z.array(safetyIdSchema).default([]),
  escalation: z.string().optional(),
  /** Excluded from the ranking when this is definitely true (unknown facts never exclude). */
  notApplicableWhen: conditionSchema.optional(),
});
export type Outcome = z.infer<typeof outcomeSchema>;

export const ruleSchema = z.object({
  id: idSchema,
  when: conditionSchema,
  evidence: evidenceSchema,
  reason: z.string().min(1),
});
export type Rule = z.infer<typeof ruleSchema>;

export const diagnosticFlowSchema = z.object({
  id: idSchema,
  version: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: slugSchema,
  symptomSlugs: z.array(slugSchema).min(1),
  /** Printer/filament situations this flow is written for. Unknown facts always qualify. */
  entryConditions: conditionSchema.optional(),
  start: idSchema,
  questions: z.array(questionSchema).min(1),
  outcomes: z.array(outcomeSchema).min(1),
  rules: z.array(ruleSchema).default([]),
  safety: z.array(safetyIdSchema).default([]),
  insufficient: z.object({
    title: z.string().min(1),
    explanation: z.string().min(1),
    checks: z.array(z.string().min(1)).min(1),
  }),
  sourceIds: z.array(slugSchema).default([]),
  verification: verificationSchema,
});
export type DiagnosticFlow = z.infer<typeof diagnosticFlowSchema>;

/** Authoring type: fields with defaults may be omitted in content files. */
export type DiagnosticFlowInput = z.input<typeof diagnosticFlowSchema>;
