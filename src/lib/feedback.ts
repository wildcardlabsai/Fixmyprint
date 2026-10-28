import { z } from "zod";

export const feedbackKinds = ["incorrect-diagnosis", "content-error", "repair-result", "contact"] as const;

export const feedbackSchema = z
  .object({
    kind: z.enum(feedbackKinds),
    message: z.string().trim().max(4000).optional().default(""),
    page: z.string().max(500).optional(),
    contactEmail: z.union([z.email().max(254), z.literal("")]).optional(),
    context: z.record(z.string(), z.unknown()).default({}),
    /** Honeypot: real users never fill this in. */
    website: z.string().max(0).optional(),
  })
  .refine((f) => f.kind === "repair-result" || f.message.length >= 3, { message: "Please add a few words describing the problem.", path: ["message"] })
  .refine((f) => JSON.stringify(f.context).length <= 8000, { message: "Context is too large.", path: ["context"] });

export type FeedbackInput = z.input<typeof feedbackSchema>;

export type FeedbackResponse =
  | { ok: true; stored: true }
  | { ok: true; stored: false; reason: "not-configured" }
  | { ok: false; error: string };
