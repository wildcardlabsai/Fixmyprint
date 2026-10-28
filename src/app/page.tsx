import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryList } from "@/components/diagnose/category-list";
import { GuideMeta } from "@/components/guides/guide-meta";
import { HomePrinterFinder } from "@/components/home/home-printer-finder";
import { LinkButton } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { guidesFor, manufacturersWithCounts } from "@/lib/data/selectors";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FEATURED_GUIDES = ["level-the-bed", "clear-a-blocked-nozzle", "clean-the-build-plate", "tune-retraction", "check-heater-and-thermistor-wiring", "check-belt-tension"];

export default async function HomePage() {
  const c = await getContent();
  const common = c.symptoms.filter((s) => s.common);
  const guides = guidesFor(c, FEATURED_GUIDES);
  const makers = manufacturersWithCounts(c).filter((m) => m.modelCount > 0);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center lg:gap-12 lg:py-14">
          <div className="max-w-xl">
            <h1 className="text-[34px] leading-[1.15] font-semibold sm:text-[44px]">Let&apos;s get your printer working again.</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-muted sm:text-lg">
              Find the cause of a printing problem and follow the steps to fix it. Choose your printer, describe what is happening, and we&apos;ll help you work through it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/diagnose" size="lg">
                Diagnose a problem
                <ArrowRight aria-hidden />
              </LinkButton>
              <LinkButton href="#symptoms" variant="secondary" size="lg">
                Start from a symptom
              </LinkButton>
            </div>
            <p className="mt-5 text-sm text-muted">Free to use, with no account needed. Your answers stay on your device.</p>
          </div>
          <div id="find-printer" className="min-w-0 scroll-mt-24 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold">Find your printer</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Advice is tailored to your printer&apos;s levelling system, extruder and enclosure.</p>
            <HomePrinterFinder printers={printerOptions(c)} manufacturers={manufacturerOptions(c)} />
          </div>
        </Container>
      </section>

      <section id="symptoms" aria-labelledby="symptoms-heading" className="scroll-mt-20 py-10 sm:py-12">
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 id="symptoms-heading" className="text-xl font-semibold sm:text-[22px]">
              What is going wrong?
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted">Not sure of your model? Start here. We&apos;ll ask about your hardware only when it changes the answer.</p>
            <CategoryList categories={c.categories} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold sm:text-[22px]">Common problems</h2>
              <Link href="/diagnose" className="text-sm font-medium whitespace-nowrap">
                All problems
              </Link>
            </div>
            <p className="mt-1 mb-4 text-sm text-muted">Go straight to the questions for the problems people run into most.</p>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {common.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={s.flowId ? `/diagnose/${s.flowId}` : `/problems/${s.category}`}
                    className="group flex items-center gap-3 px-3.5 py-3 text-ink no-underline transition-colors hover:bg-page"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{s.title}</span>
                      <span className="block truncate text-sm text-muted">{s.description}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted group-hover:text-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section aria-labelledby="guides-heading" className="py-10">
        <Container>
          <SectionHeading id="guides-heading" title="Repair guides" description="Step-by-step procedures that adapt to your printer's hardware." action={{ href: "/guides", label: "All guides" }} />
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="group flex flex-col gap-1 px-4 py-3.5 text-ink no-underline hover:bg-page sm:flex-row sm:items-center sm:gap-6">
                  <span className="flex-1">
                    <span className="block font-medium">{g.title}</span>
                    <span className="block text-sm text-muted">{g.summary}</span>
                  </span>
                  <GuideMeta guide={g} />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="how-heading" className="py-10">
        <Container>
          <div className="grid gap-8 rounded-lg border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <h2 id="how-heading" className="text-xl font-semibold sm:text-[22px]">
                How diagnosis works
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Each diagnosis is a written decision tree, not a chatbot. The same answers always give the same result, and every suggested cause shows which answers support it.
              </p>
              <Link href="/about" className="mt-3 inline-block text-sm font-medium">
                More about how content is written and reviewed
              </Link>
            </div>
            <ol className="grid gap-5 sm:grid-cols-2">
              {[
                ["Describe what you see", "Pick the closest description. Each answer decides which question comes next."],
                ["Use your printer's details", "If you choose your printer, questions its specifications already answer are skipped."],
                ["See the likely causes", "Causes are ranked by how well they match, with a plain confidence label rather than invented percentages."],
                ["Fix it, or try the next cause", "Follow the repair steps. If it is still not fixed, move on to the next most likely cause."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line-strong text-sm font-semibold text-primary-dark">{i + 1}</span>
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section aria-labelledby="library-heading" className="py-10">
        <Container>
          <SectionHeading
            id="library-heading"
            title="Printer library"
            description={`${c.printers.length} printer models documented so far. The library is still being built, and every record shows how far it has been checked.`}
            action={{ href: "/printers", label: "Browse the library" }}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {makers.map((m) => (
              <div key={m.slug} className="rounded-lg border border-line bg-surface p-4">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-muted">
                    {m.modelCount} {m.modelCount === 1 ? "model" : "models"}
                  </span>
                </p>
                <ul className="mt-2 space-y-1">
                  {c.printers
                    .filter((p) => p.manufacturer === m.slug)
                    .map((p) => (
                      <li key={p.slug}>
                        <Link href={`/printers/${p.slug}`} className="text-sm">
                          {p.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
