import type { PrinterType, Symptom, VisualAsset } from "@/lib/schema";

/** Pure helpers for the visual symptom library. Safe on server and client. */

export type AssetMap = Record<string, VisualAsset>;

export const assetMap = (assets: VisualAsset[], ids?: Iterable<string>): AssetMap => {
  const wanted = ids ? new Set(ids) : null;
  return Object.fromEntries(assets.filter((a) => !wanted || wanted.has(a.id)).map((a) => [a.id, a]));
};

/** The first image in preference order that is actually available. Missing photos are skipped. */
export function pickImage(assets: AssetMap, ids: string[]): VisualAsset | null {
  for (const id of ids) {
    const a = assets[id];
    if (a && a.status === "available" && a.file) return a;
  }
  return null;
}

/** Problems that apply to a printing technology. Unknown technology shows filament problems. */
export const symptomsForType = <T extends Pick<Symptom, "printerTypes">>(symptoms: T[], type: PrinterType) =>
  symptoms.filter((s) => s.printerTypes.includes(type));

export const isVisual = (s: Pick<Symptom, "images">) => s.images.length > 0;

/** Where a symptom leads: its diagnosis with its answers pre-filled, or its category. */
export function symptomHref(s: Pick<Symptom, "slug" | "flowId" | "category">, printerSlug?: string | null) {
  if (!s.flowId) return `/problems/${s.category}`;
  const p = new URLSearchParams({ symptom: s.slug });
  if (printerSlug) p.set("printer", printerSlug);
  return `/diagnose/${s.flowId}?${p}`;
}

/**
 * The symptom a set of answers corresponds to: the one in this flow whose
 * pre-filled answers all match, preferring the most specific.
 */
export function symptomForAnswers<T extends Pick<Symptom, "flowId" | "preset">>(symptoms: T[], flowId: string, answers: Record<string, string>): T | null {
  let best: T | null = null;
  let bestSize = 0;
  for (const s of symptoms) {
    if (s.flowId !== flowId) continue;
    const entries = Object.entries(s.preset);
    if (entries.length === 0 || !entries.every(([q, o]) => answers[q] === o)) continue;
    if (entries.length > bestSize) {
      best = s;
      bestSize = entries.length;
    }
  }
  return best;
}
