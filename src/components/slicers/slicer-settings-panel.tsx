"use client";

import { ExternalLink, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId } from "react";
import { useSavedPrinter, useSavedSlicer } from "@/lib/client/storage";
import { SLICER_SETTING_LABELS, type PrinterModel, type Slicer, type SlicerSettingKey } from "@/lib/schema";
import { findSlicer, resolveSetting, slicersForPrinter } from "@/lib/slicers";
import { cn } from "@/lib/cn";

interface Props {
  settingKeys: SlicerSettingKey[];
  slicers: Slicer[];
  printers: Pick<PrinterModel, "slug" | "manufacturer">[];
  /** The printer in use. When omitted, the ?printer= parameter or the saved printer is used. */
  printerSlug?: string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Shows where the settings a cause or guide refers to are found in the
 * person's slicer. Names come only from the slicer developer's documentation;
 * anything else is shown as not documented rather than guessed.
 */
export function SlicerSettingsPanel(p: Props) {
  const id = useId();
  const params = useSearchParams();
  const [savedPrinter] = useSavedPrinter();
  const [savedSlicer, setSavedSlicer] = useSavedSlicer();
  const content = { slicers: p.slicers };

  const printerSlug = p.printerSlug !== undefined ? p.printerSlug : (params.get("printer") ?? savedPrinter);
  const printer = p.printers.find((x) => x.slug === printerSlug) ?? null;
  const forPrinter = printer ? slicersForPrinter(content, printer) : [];
  const slicer = findSlicer(content, savedSlicer) ?? forPrinter[0]?.slicer ?? null;
  const others = p.slicers.filter((s) => !forPrinter.some((x) => x.slicer.slug === s.slug)).sort((a, b) => a.name.localeCompare(b.name));

  if (p.settingKeys.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className={cn("rounded-lg border border-line bg-surface p-4", p.className)}>
      <h3 id={`${id}-heading`} className="flex items-center gap-2 font-semibold">
        <SlidersHorizontal className="size-4 text-primary-dark" aria-hidden />
        In your slicer
      </h3>
      <div className="mt-2">
        <label htmlFor={`${id}-select`} className="text-sm text-muted">
          Slicer
        </label>
        <select
          id={`${id}-select`}
          className="mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-primary"
          value={slicer?.slug ?? ""}
          onChange={(e) => setSavedSlicer(e.target.value || null)}
        >
          {!slicer && <option value="">Choose your slicer</option>}
          {forPrinter.length > 0 && (
            <optgroup label="Named by your printer's manufacturer">
              {forPrinter.map(({ slicer: s, link }) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                  {link.relation === "official" ? " (official)" : ""}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={forPrinter.length > 0 ? "Other slicers" : "Slicers"}>
            {others.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
        {slicer && !savedSlicer && forPrinter[0] && (
          <p className="mt-1 text-xs text-muted">
            Showing {forPrinter[0].link.relation === "official" ? "your printer manufacturer's own slicer" : "a slicer your printer's manufacturer names"}. Choose another
            if you use something else; the choice is saved on this device.
          </p>
        )}
      </div>

      {slicer ? (
        <dl className={cn("mt-3 divide-y divide-line border-t border-line text-sm", p.compact && "text-[13px]")}>
          {p.settingKeys.map((key) => (
            <SettingRow key={key} settingKey={key} slicer={slicer} slicers={p.slicers} />
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">Choose the slicer you use to see what these settings are called and where to find them.</p>
      )}

      {slicer && (
        <p className="mt-3 text-sm">
          <Link href={`/slicers/${slicer.slug}`}>More about {slicer.name}</Link>
        </p>
      )}
    </section>
  );
}

function SettingRow({ settingKey, slicer, slicers }: { settingKey: SlicerSettingKey; slicer: Slicer; slicers: Slicer[] }) {
  const resolved = resolveSetting({ slicers }, slicer, settingKey);
  const label = SLICER_SETTING_LABELS[settingKey];
  return (
    <div className="py-2.5">
      <dt className="text-muted">{label.label}</dt>
      {resolved ? (
        <>
          <dd className="font-medium text-ink">{resolved.setting.name}</dd>
          {resolved.setting.location && !resolved.inherited && <dd className="text-muted">{resolved.setting.location}</dd>}
          {resolved.inherited && (
            <dd className="mt-0.5 text-xs text-ink/80">
              <span className="font-medium">Not confirmed for {slicer.name}.</span> {slicer.name} does not document this. The name comes from {resolved.documentedBy.name}, which it is built on. The name and where it sits may differ.
            </dd>
          )}
          {resolved.setting.note && !resolved.inherited && <dd className="mt-0.5 text-xs text-muted">{resolved.setting.note}</dd>}
          <dd className="mt-0.5 text-xs">
            <a href={resolved.setting.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
              Source
              <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </dd>
        </>
      ) : (
        <dd className="text-muted">Not documented by {slicer.developer} in the sources we checked.</dd>
      )}
    </div>
  );
}
