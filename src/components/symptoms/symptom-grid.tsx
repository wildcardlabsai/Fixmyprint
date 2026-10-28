"use client";

import { ArrowRight, CircleHelp, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { PrinterType, Symptom, SymptomCategory } from "@/lib/schema";
import { pickImage, symptomHref, type AssetMap } from "@/lib/visual";
import { SymptomCard } from "./symptom-card";

export type SymptomView = Pick<Symptom, "slug" | "title" | "description" | "category" | "flowId" | "images" | "printerTypes">;

interface Props {
  /** Visual symptoms for the current printing technology. */
  symptoms: SymptomView[];
  /** Problems that cannot be identified by eye, such as Wi-Fi faults, for "Something else". */
  otherProblems: SymptomView[];
  categories: Pick<SymptomCategory, "slug" | "title">[];
  assets: AssetMap;
  printerType: PrinterType;
  printerSlug: string | null;
  headingLevel?: "h2" | "h3";
}

const NOT_SURE = "not-sure";
const SOMETHING_ELSE = "something-else";

/**
 * "What does the problem look like?" as a grid of picture cards. Choosing a
 * card and continuing opens its diagnosis with the matching answer filled in.
 * "I'm not sure" and "Something else" lead to text options instead, so nobody
 * has to pick a picture that does not match.
 */
export function SymptomGrid({ symptoms, otherProblems, categories, assets, printerType, printerSlug, headingLevel = "h2" }: Props) {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const Heading = headingLevel;

  const usedCategories = categories.filter((c) => symptoms.some((s) => s.category === c.slug));
  const shown = category ? symptoms.filter((s) => s.category === category) : symptoms;
  const choice = symptoms.find((s) => s.slug === selected) ?? null;

  return (
    <section aria-labelledby={`${id}-h`}>
      <Heading id={`${id}-h`} className="text-lg font-semibold">
        What does the problem look like?
      </Heading>
      <p className="mt-1 text-sm text-ink/70">
        Choose the picture closest to your print. The pictures are examples of each problem, to help you recognise it.
      </p>

      {usedCategories.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Show problems in one area">
          {[{ slug: null, title: "All" }, ...usedCategories].map((c) => (
            <button
              key={c.slug ?? "all"}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => setCategory(c.slug)}
              className={cn(
                "inline-flex h-8 items-center rounded-md border px-2.5 text-sm transition-colors",
                category === c.slug ? "border-primary bg-primary-50 font-medium text-primary-dark" : "border-line bg-surface text-ink hover:border-line-strong",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      <fieldset className="mt-4">
        <legend className="sr-only">What does the problem look like? {printerType === "msla" ? "Resin printer problems." : "Filament printer problems."}</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => (
            <SymptomCard
              key={s.slug}
              name={`${id}-symptom`}
              value={s.slug}
              title={s.title}
              description={s.description}
              asset={pickImage(assets, s.images)}
              checked={selected === s.slug}
              onSelect={setSelected}
            />
          ))}
          <SymptomCard
            name={`${id}-symptom`}
            value={NOT_SURE}
            title="I'm not sure"
            description="None of these look quite right, or I can't tell."
            art={<CircleHelp className="size-10" strokeWidth={1.5} />}
            checked={selected === NOT_SURE}
            onSelect={setSelected}
          />
          <SymptomCard
            name={`${id}-symptom`}
            value={SOMETHING_ELSE}
            title="Something else"
            description="An error message, a connection problem or something not shown here."
            art={<Ellipsis className="size-10" strokeWidth={1.5} />}
            checked={selected === SOMETHING_ELSE}
            onSelect={setSelected}
          />
        </div>
      </fieldset>

      <div aria-live="polite" className="sticky bottom-0 z-10 mt-4">
        {choice && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-surface p-3.5 shadow-md sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-sm">
              <span className="block text-ink/70">Selected</span>
              <span className="text-[15px] font-semibold">{choice.title}</span>
            </p>
            <LinkButton href={symptomHref(choice, printerSlug)} size="lg">
              Continue
              <ArrowRight aria-hidden />
            </LinkButton>
          </div>
        )}
        {selected === NOT_SURE && (
          <div className="rounded-lg border border-line bg-surface p-4 shadow-md">
            <p className="font-semibold">Start from the area of the printer instead</p>
            <p className="mt-1 text-sm text-ink/70">Each area asks a few questions in plain words before suggesting a cause.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {usedCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/problems/${c.slug}${printerSlug ? `?printer=${printerSlug}` : ""}`} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5 text-ink no-underline hover:border-primary">
                    <span className="text-[15px]">{c.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {selected === SOMETHING_ELSE && (
          <div className="rounded-lg border border-line bg-surface p-4 shadow-md">
            <p className="font-semibold">Problems you can&apos;t see in the print</p>
            {otherProblems.length > 0 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {otherProblems.map((s) => (
                  <li key={s.slug}>
                    <Link href={symptomHref(s, printerSlug)} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5 text-ink no-underline hover:border-primary">
                      <span className="text-[15px]">{s.title}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-sm">
              Not listed? <Link href="/search">Search everything</Link>, look up an <Link href="/error-codes">error message</Link>, or{" "}
              <Link href="/contact">tell us what you are seeing</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
