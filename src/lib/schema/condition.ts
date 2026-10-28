import { z } from "zod";

/**
 * Facts the rules engine can reason about. Printer facts come from the selected
 * printer's record; others can be set by answers (for example the filament in use).
 */
export const factKeySchema = z.enum([
  "printer.selected",
  "printer.levelling",
  "printer.extruder",
  "printer.enclosure",
  "printer.motion",
  "printer.firmware",
  "printer.multiMaterial",
  "printer.linearMotion",
  "printer.bedSurface",
  "filament",
]);
export type FactKey = z.infer<typeof factKeySchema>;

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { fact: FactKey; in: string[] }
  | { answer: string; in: string[] };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
    z.object({ fact: factKeySchema, in: z.array(z.string()).min(1) }).strict(),
    z.object({ answer: z.string().min(1), in: z.array(z.string()).min(1) }).strict(),
  ]),
);
