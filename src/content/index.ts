import { z } from "zod";
import {
  diagnosticFlowSchema,
  errorCodeSchema,
  filamentSchema,
  guideSchema,
  maintenanceTaskSchema,
  manufacturerSchema,
  partSchema,
  printerModelSchema,
  safetyNoticeSchema,
  sourceReferenceSchema,
  symptomCategorySchema,
  symptomSchema,
} from "@/lib/schema";
import { errorCodeInputs } from "./error-codes";
import { filamentInputs } from "./filaments";
import { flowInputs } from "./flows";
import { guideInputs } from "./guides";
import { maintenanceInputs } from "./maintenance";
import { partInputs } from "./parts";
import { manufacturers as manufacturerInputs, printers as printerInputs } from "./printers";
import { safetyNotices as safetyInputs, sources as sourceInputs } from "./shared";
import { symptomCategories as categoryInputs, symptoms as symptomInputs } from "./symptoms";

/** Bumped whenever seed content changes in a way that should be re-synced to the database. */
export const CONTENT_VERSION = "2026-10-27.1";

function parseAll<T extends z.ZodType>(schema: T, items: unknown[], label: string): z.infer<T>[] {
  return items.map((item, i) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const id = (item as { slug?: string; id?: string }).slug ?? (item as { id?: string }).id ?? i;
      throw new Error(`Invalid ${label} "${id}": ${z.prettifyError(result.error)}`);
    }
    return result.data;
  });
}

export interface RawContent {
  sources: unknown[];
  safetyNotices: unknown[];
  manufacturers: unknown[];
  printers: unknown[];
  categories: unknown[];
  symptoms: unknown[];
  flows: unknown[];
  guides: unknown[];
  filaments: unknown[];
  maintenance: unknown[];
  parts: unknown[];
  errorCodes: unknown[];
}

/** Validates raw content from any source (bundled seed or database) into typed content. */
export function parseContent(raw: RawContent, version: string) {
  return {
    version,
    sources: parseAll(sourceReferenceSchema, raw.sources, "source"),
    safetyNotices: parseAll(safetyNoticeSchema, raw.safetyNotices, "safety notice"),
    manufacturers: parseAll(manufacturerSchema, raw.manufacturers, "manufacturer"),
    printers: parseAll(printerModelSchema, raw.printers, "printer"),
    categories: parseAll(symptomCategorySchema, raw.categories, "symptom category"),
    symptoms: parseAll(symptomSchema, raw.symptoms, "symptom"),
    flows: parseAll(diagnosticFlowSchema, raw.flows, "diagnostic flow"),
    guides: parseAll(guideSchema, raw.guides, "guide"),
    filaments: parseAll(filamentSchema, raw.filaments, "filament"),
    maintenance: parseAll(maintenanceTaskSchema, raw.maintenance, "maintenance task"),
    parts: parseAll(partSchema, raw.parts, "part"),
    errorCodes: parseAll(errorCodeSchema, raw.errorCodes, "error code"),
  };
}

export type SeedContent = ReturnType<typeof parseContent>;

/**
 * The bundled seed content, validated at load time. An invalid record fails the
 * build and the test suite rather than reaching users.
 */
export const seed: SeedContent = parseContent(
  {
    sources: sourceInputs,
    safetyNotices: safetyInputs,
    manufacturers: manufacturerInputs,
    printers: printerInputs,
    categories: categoryInputs,
    symptoms: symptomInputs,
    flows: flowInputs,
    guides: guideInputs,
    filaments: filamentInputs,
    maintenance: maintenanceInputs,
    parts: partInputs,
    errorCodes: errorCodeInputs,
  },
  CONTENT_VERSION,
);
