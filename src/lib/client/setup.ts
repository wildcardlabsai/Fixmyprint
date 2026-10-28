"use client";

import type { SlicerChoice } from "@/lib/data/view-models";
import { useSavedSlicer } from "./storage";

/**
 * The slicer to show setting names for: the one saved on this device, or else
 * the printer manufacturer's own slicer. Shared by the header, guides and
 * results, so changing it anywhere changes it everywhere.
 */
export function useSlicerChoice(forPrinter: SlicerChoice[], known: string[]) {
  const [saved, setSaved] = useSavedSlicer();
  const savedSlug = saved && known.includes(saved) ? saved : null;
  const slug = savedSlug ?? forPrinter[0]?.slug ?? null;
  return { slug, isDefault: savedSlug === null && slug !== null, saved: savedSlug, setSlicer: setSaved };
}
