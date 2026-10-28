import { ArrowRight, ChevronRight, Database, Factory, Images, ListChecks, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryList } from "@/components/diagnose/category-list";
import { GuideMeta } from "@/components/guides/guide-meta";
import { HomePrinterFinder } from "@/components/home/home-printer-finder";
import { SiteSearch } from "@/components/layout/site-search";
import { LinkButton } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { guidesFor, manufacturersWithCounts } from "@/lib/data/selectors";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";
import { benefits, heroEyebrow, type Benefit } from "@/lib/home-copy";
import { symptomHref } from "@/lib/visual";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const BENEFIT_ICONS: Record<Benefit["icon"], typeof Printer> = {
  brands: Factory,
  steps: ListChecks,
  data: Database,
  visual: Images,
  "printer-types": Printer,
};

const FEATURED_GUIDES = ["level-the-bed", "clear-a-blocked-nozzle", "clean-the-build-plate", "tune-retraction", "check-heater-and-thermistor-wiring", "check-belt-tension"];

export default async function HomePage() {
  const c = await getContent();
  const common = c.symptoms.filter((s) => s.common);
  const guides = guidesFor(c, FEATURED_GUIDES);
  const makers = manufacturersWithCounts(c).filter((m) => m.modelCount > 0);

  return (
    <>
      <section aria-labelledby="hero-heading" className="border-b border-line bg-surface">
        <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:py-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.08em] text-primary-dark">{heroEyebrow(c)}</p>
            <h1 id="hero-heading" className="mt-3 text-[34px] leading-[1.12] font-semibold tracking-tight sm:text-[44px] lg:text-[46px]">
              Let’s get your printer working again.
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink/75 sm:text-lg">
              Find the cause of a printing problem and follow clear, step-by-step instructions to fix it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/diagnose" size="lg">
                Diagnose a problem
                <ArrowRight aria-hidden />
              </LinkButton>
              <LinkButton href="#find-printer" variant="secondary" size="lg">
                Find my printer
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-ink/70">Start immediately without creating an account · Model-specific guidance</p>
            <SiteSearch
              className="mt-6 max-w-xl"
              large
              showLabel
              label="Search by printer model, manufacturer, symptom, or error code"
              placeholder="e.g. Bambu Lab A1, Ender 3, Prusa MK4S, Adventurer 5M"
            />
          </div>
          <div className="min-w-0">
            {/* Pre-sized WebP files in public/images/home; next/image would only resize them again. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/home/hero-1280.webp"
              srcSet="/images/home/hero-640.webp 640w, /images/home/hero-960.webp 960w, /images/home/hero-1280.webp 1280w, /images/home/hero-1536.webp 1536w"
              sizes="(min-width: 1152px) 580px, (min-width: 1024px) 52vw, calc(100vw - 32px)"
              width={1536}
              height={1024}
              fetchPriority="high"
              decoding="async"
              alt="Illustration: a laptop showing a printer troubleshooting screen, beside a 3D printer, filament spools and printed test parts"
              className="aspect-[3/2] h-auto w-full rounded-xl border border-line object-cover shadow-sm"
            />
          </div>
        </Container>
      </section>

      <section aria-labelledby="benefits-heading" className="border-b border-line bg-page">
        <Container className="py-6">
          <h2 id="benefits-heading" className="sr-only">
            What FixMyPrint offers
          </h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {benefits(c).map((b) => {
              const Icon = BENEFIT_ICONS[b.icon];
              return (
                <li key={b.icon} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-dark">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{b.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink/70">{b.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="start-heading" className="py-10 sm:py-12">
        <Container className="grid gap-6 lg:grid-cols-2">
          <h2 id="start-heading" className="sr-only">
            Start troubleshooting
          </h2>
          <div id="find-printer" className="min-w-0 scroll-mt-24 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold">Find your printer</h3>
            <p className="mt-1 mb-4 text-sm text-ink/70">Advice is tailored to your printer&apos;s levelling system, extruder and enclosure.</p>
            <HomePrinterFinder printers={printerOptions(c)} manufacturers={manufacturerOptions(c)} />
          </div>
          <div id="symptoms" className="min-w-0 scroll-mt-24">
            <h3 className="text-lg font-semibold">What is going wrong?</h3>
            <p className="mt-1 mb-4 text-sm text-ink/70">Not sure of your model? Start here. We&apos;ll ask about your hardware only when it changes the answer.</p>
            <CategoryList categories={c.categories} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="common-heading" className="pb-10">
        <Container>
          <SectionHeading id="common-heading" title="Common problems" description="Go straight to the questions for the problems people run into most." action={{ href: "/diagnose", label: "All problems" }} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {common.map((s) => (
              <li key={s.slug}>
                <Link
                  href={symptomHref(s)}
                  className="group flex h-full items-start gap-3 rounded-lg border border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-line-strong"
                >
                  <span className="flex-1">
                    <span className="block font-medium">{s.title}</span>
                    <span className="mt-1 block text-sm text-ink/70">{s.description}</span>
                  </span>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted group-hover:text-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
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
