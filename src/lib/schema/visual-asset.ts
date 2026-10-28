import { z } from "zod";
import { slugSchema } from "./common";

/**
 * An image in the visual symptom library. The asset manifest records where every
 * image came from. A photograph is only "available" with a named creator, licence
 * and source; until one is obtained it stays "missing" and the interface falls
 * back to the illustration, never to an unlicensed image.
 */
export const visualAssetSchema = z
  .object({
    id: slugSchema,
    kind: z.enum(["photo", "illustration"]),
    status: z.enum(["available", "missing"]),
    /** Path under /public, for example "/symptoms/illustrations/stringing.svg". */
    file: z.string().startsWith("/").nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    alt: z.string().min(1),
    /** What it shows, as "symptom:<slug>" or "option:<flow>/<question>/<option>". */
    subject: z.string().regex(/^(symptom|option):[a-z0-9/-]+$/),
    creator: z.string().nullable(),
    licence: z.string().nullable(),
    sourceUrl: z.url().nullable(),
    /** Attribution text the licence requires, shown under the image. */
    attribution: z.string().nullable(),
    notes: z.string().optional(),
  })
  .superRefine((a, ctx) => {
    if (a.status === "available" && (!a.file || !a.width || !a.height)) ctx.addIssue({ code: "custom", message: "An available asset needs a file and its size" });
    if (a.status === "available" && a.kind === "photo" && (!a.creator || !a.licence || !a.sourceUrl)) {
      ctx.addIssue({ code: "custom", message: "A photograph needs a creator, licence and source before it can be used" });
    }
  });
export type VisualAsset = z.infer<typeof visualAssetSchema>;
export type VisualAssetInput = z.input<typeof visualAssetSchema>;
