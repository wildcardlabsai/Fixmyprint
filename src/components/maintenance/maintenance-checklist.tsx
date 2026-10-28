"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { useSavedPrinter } from "@/lib/client/storage";
import { evaluateCondition, factsFromPrinter } from "@/lib/engine/conditions";
import type { MaintenanceTask, PrinterModel, SafetyNotice } from "@/lib/schema";

interface Props {
  tasks: MaintenanceTask[];
  printers: PrinterModel[];
  names: Record<string, string>;
  guideTitles: Record<string, string>;
  safetyNotices: SafetyNotice[];
}

export function MaintenanceChecklist({ tasks, printers, names, guideTitles, safetyNotices }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [saved] = useSavedPrinter();
  const fromUrl = params.get("printer");
  const slug = [fromUrl, saved].find((s) => s && printers.some((p) => p.slug === s)) ?? "";
  const printer = printers.find((p) => p.slug === slug) ?? null;
  const facts = factsFromPrinter(printer);

  const shown = tasks
    .map((t) => ({ t, applies: t.appliesWhen ? evaluateCondition(t.appliesWhen, { facts, answers: {} }) : true }))
    .filter((x) => x.applies !== false)
    .sort((a, b) => a.t.interval.sortHours - b.t.interval.sortHours);
  const hidden = tasks.length - shown.length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-surface p-4">
        <label htmlFor="maint-printer" className="block font-semibold">
          Show the checklist for
        </label>
        <select
          id="maint-printer"
          value={slug}
          onChange={(e) => router.replace(e.target.value ? `/maintenance?printer=${e.target.value}` : "/maintenance", { scroll: false })}
          className="mt-2 h-11 w-full max-w-sm rounded-md border border-line-strong bg-surface px-3 text-[15px] focus:border-primary focus:outline-none"
        >
          <option value="">Any printer (show everything)</option>
          {printers.map((p) => (
            <option key={p.slug} value={p.slug}>
              {names[p.slug]}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          {printer
            ? `${shown.length} tasks for the ${names[printer.slug]}${hidden ? `; ${hidden} that do not apply to its hardware are hidden` : ""}. Tasks that depend on hardware we have not verified are shown and labelled.`
            : "All tasks are shown. Tasks that only apply to some hardware are labelled."}
        </p>
      </div>

      <ul className="space-y-3">
        {shown.map(({ t, applies }) => (
          <li key={t.slug} id={t.slug} className="scroll-mt-24 rounded-lg border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[17px] font-semibold">{t.title}</h2>
              <p className="text-sm font-medium text-primary-dark">{t.interval.label}</p>
            </div>
            {applies === "unknown" && t.appliesLabel && <p className="mt-1 text-xs font-semibold tracking-wide text-ink/70 uppercase">{t.appliesLabel} only</p>}
            <p className="mt-1 text-[15px] text-muted">{t.summary}</p>
            {t.tools.length > 0 && (
              <p className="mt-2 text-sm">
                <span className="font-medium">You will need: </span>
                {t.tools.join(", ")}
              </p>
            )}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px]">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {t.cautions.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-md bg-warning-50 p-3 text-sm text-warning-text">
                {t.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted">Safety for this task</summary>
              <SafetyNotices ids={t.safety} notices={safetyNotices} className="mt-2" />
            </details>
            {t.guideSlugs.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-x-4 text-sm">
                {t.guideSlugs.map((g) => (
                  <Link key={g} href={`/guides/${g}${slug ? `?printer=${slug}` : ""}`}>
                    {guideTitles[g] ?? g}
                  </Link>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
