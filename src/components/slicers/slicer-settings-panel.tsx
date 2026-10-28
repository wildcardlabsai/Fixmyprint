"use client";

import { ExternalLink, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId } from "react";
import { useSlicerChoice } from "@/lib/client/setup";
import { useSavedPrinter } from "@/lib/client/storage";
import { cn } from "@/lib/cn";
import { SLICER_SETTING_LABELS, type Guide, type PrinterModel, type Slicer, type SlicerSettingKey } from "@/lib/schema";
import { findSlicer, resolveSetting, slicersForPrinter, type ResolvedSetting } from "@/lib/slicers";
import { SlicerSelect } from "./slicer-select";

interface Props {
  settingKeys: SlicerSettingKey[];
  slicers: Slicer[];
  printers: Pick<PrinterModel, "slug" | "manufacturer">[];
  /** The printer in use. When omitted, the ?printer= parameter or the saved printer is used. */
  printerSlug?: string | null;
  /** General starting values from a guide, shown beside the slicer's name for the same setting. */
  values?: Guide["settings"];
  title?: string;
  className?: string;
}

/** The slicer in use for a printer, shared by everything that shows slicer setting names. */
export function useSlicerFor(slicers: Slicer[], printers: Pick<PrinterModel, "slug" | "manufacturer">[], printerSlug: string | null) {
  const printer = printers.find((x) => x.slug === printerSlug) ?? null;
  const forPrinter = printer ? slicersForPrinter({ slicers }, printer).map(({ slicer, link }) => ({ slug: slicer.slug, official: link.relation === "official" })) : [];
  const choice = useSlicerChoice(
    forPrinter,
    slicers.map((s) => s.slug),
  );
  return { ...choice, slicer: findSlicer({ slicers }, choice.slug), forPrinter };
}

/**
 * Where the settings a cause or guide refers to are found in the person's
 * slicer. Names come only from the slicer developer's documentation; anything
 * else is shown as not confirmed or not documented rather than guessed.
 */
export function SlicerSettingsPanel(p: Props) {
  const id = useId();
  const params = useSearchParams();
  const [savedPrinter] = useSavedPrinter();
  const printerSlug = p.printerSlug !== undefined ? p.printerSlug : (params.get("printer") ?? savedPrinter);
  const { slicer, forPrinter, isDefault, slug, setSlicer } = useSlicerFor(p.slicers, p.printers, printerSlug);
  const values = p.values ?? [];
  const keys = [...new Set([...p.settingKeys, ...values.flatMap((v) => (v.key ? [v.key] : []))])];
  const unkeyed = values.filter((v) => !v.key);

  if (keys.length === 0 && unkeyed.length === 0) return null;

  const resolved = new Map(keys.map((k) => [k, slicer ? resolveSetting({ slicers: p.slicers }, slicer, k) : null]));
  const inheritedFrom = [...new Set([...resolved.values()].filter((r): r is ResolvedSetting => Boolean(r?.inherited)).map((r) => r.documentedBy.name))];

  return (
    <section aria-labelledby={`${id}-heading`} className={cn("rounded-lg border border-line bg-surface p-4", p.className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 id={`${id}-heading`} className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4 text-primary-dark" aria-hidden />
          {p.title ?? "In your slicer"}
        </h3>
      </div>
      <div className="mt-2">
        <label htmlFor={`${id}-select`} className="sr-only">
          Slicer
        </label>
        <SlicerSelect id={`${id}-select`} slicers={p.slicers} forPrinter={forPrinter} value={slug} onChange={setSlicer} />
        {isDefault && <p className="mt-1 text-xs text-ink/70">Your printer maker&apos;s slicer. Change it if you use another; we&apos;ll remember on this device.</p>}
      </div>

      {slicer && inheritedFrom.length > 0 && (
        <p className="mt-3 rounded-md bg-page px-3 py-2 text-xs leading-relaxed text-ink/80">
          {slicer.developer} doesn&apos;t publish names for some of these. Those marked <span className="font-medium">not confirmed</span> come from{" "}
          {inheritedFrom.join(" and ")}, which {slicer.name} is built on, and may differ.
        </p>
      )}

      <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
        {keys.map((key) => {
          const r = resolved.get(key) ?? null;
          const typical = values.filter((v) => v.key === key);
          return (
            <div key={key} className="py-2.5">
              <dt className="flex items-center justify-between gap-2 text-muted">
                <span>{SLICER_SETTING_LABELS[key].label}</span>
                {r?.inherited && <span className="shrink-0 rounded border border-line-strong px-1.5 text-xs font-medium text-ink/80">not confirmed</span>}
              </dt>
              {!slicer ? null : r ? (
                <dd>
                  <span className="block font-medium text-ink">{r.setting.name}</span>
                  {!r.inherited && r.setting.location && <span className="block text-muted">{r.setting.location}</span>}
                  {!r.inherited && r.setting.note && <span className="mt-0.5 block text-xs text-ink/70">{r.setting.note}</span>}
                  <a href={r.setting.sourceUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs">
                    {r.inherited ? `${r.documentedBy.name} source` : "Source"}
                    <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </dd>
              ) : (
                <dd className="text-muted">Not documented by {slicer.developer}</dd>
              )}
              {typical.map((v) => (
                <dd key={v.name} className="mt-1 text-[13px]">
                  <span className="text-muted">{v.name}: </span>
                  <span className="font-medium">{v.value}</span>
                  {v.note && <span className="block text-xs text-ink/70">{v.note}</span>}
                </dd>
              ))}
            </div>
          );
        })}
        {unkeyed.map((v) => (
          <div key={v.name} className="py-2.5">
            <dt className="text-muted">{v.name}</dt>
            <dd className="font-medium">{v.value}</dd>
            {v.note && <dd className="text-xs text-ink/70">{v.note}</dd>}
          </div>
        ))}
      </dl>

      {!slicer && <p className="mt-1 text-sm text-muted">Choose your slicer to see what these settings are called and where to find them.</p>}
      {slicer && (
        <p className="mt-2 text-sm">
          <Link href={`/slicers/${slicer.slug}`}>More about {slicer.name}</Link>
        </p>
      )}
    </section>
  );
}

/** A one-line reminder inside a guide step of where its settings are in the person's slicer. */
export function StepSlicerHint({
  settingKeys,
  slicers,
  slicer,
  forPrinter,
  onChoose,
}: {
  settingKeys: SlicerSettingKey[];
  slicers: Slicer[];
  slicer: Slicer | null;
  forPrinter: { slug: string; official: boolean }[];
  onChoose: (slug: string | null) => void;
}) {
  const id = useId();
  if (settingKeys.length === 0) return null;
  if (!slicer) {
    return (
      <div className="mt-3 flex flex-col gap-1.5 rounded-md bg-page px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor={id} className="shrink-0 text-muted">
          Which slicer do you use?
        </label>
        <SlicerSelect id={id} slicers={slicers} forPrinter={forPrinter} value={null} onChange={onChoose} className="py-1.5 text-sm sm:max-w-64" />
      </div>
    );
  }
  return (
    <ul className="mt-3 space-y-1 rounded-md bg-page px-3 py-2.5 text-sm">
      {settingKeys.map((k) => {
        const r = resolveSetting({ slicers }, slicer, k);
        return (
          <li key={k}>
            <span className="text-muted">In {slicer.name}: </span>
            {r ? (
              <>
                <span className="font-medium">{r.setting.name}</span>
                {!r.inherited && r.setting.location && <span className="text-muted"> · {r.setting.location}</span>}
                {r.inherited && <span className="text-muted"> (not confirmed)</span>}
              </>
            ) : (
              <span className="text-muted">{SLICER_SETTING_LABELS[k].label.toLowerCase()} is not documented by {slicer.developer}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
