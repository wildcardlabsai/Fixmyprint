import { ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavePrinterButton } from "@/components/printers/save-printer-button";
import { LinkButton } from "@/components/ui/button";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { ReviewBadge, ReviewDetails } from "@/components/ui/review-status";
import { SourceList } from "@/components/ui/source-list";
import { getContent } from "@/lib/data/repository";
import { errorCodesForFirmware, findManufacturer, findPrinter, guidesForPrinter, guidesFor, printerDisplayName } from "@/lib/data/selectors";
import { evaluateCondition, factsFromPrinter } from "@/lib/engine/conditions";
import { specRows, UNKNOWN } from "@/lib/printer-labels";
import { slicersForPrinter } from "@/lib/slicers";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).printers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const p = findPrinter(c, slug);
  if (!p) return {};
  const name = printerDisplayName(c, p);
  return {
    title: `${name}: specifications and troubleshooting`,
    description: `${p.summary} Troubleshooting notes, error messages and repair guides for the ${name}.`,
    alternates: { canonical: `/printers/${p.slug}` },
  };
}

export default async function PrinterPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = await getContent();
  const p = findPrinter(c, slug);
  if (!p) notFound();
  const maker = findManufacturer(c, p.manufacturer);
  const name = printerDisplayName(c, p);
  const rows = specRows(p, (s) => c.filaments.find((f) => f.slug === s)?.name ?? s);
  const facts = factsFromPrinter(p);
  const fits = (g: { appliesWhen?: Parameters<typeof evaluateCondition>[0] }) => !g.appliesWhen || evaluateCondition(g.appliesWhen, { facts, answers: {} }) !== false;
  const { specific, general } = guidesForPrinter(c, p.slug);
  const noteGuides = guidesFor(c, [...new Set(p.troubleshootingNotes.flatMap((n) => n.guideSlugs))]);
  const errors = errorCodesForFirmware(c, p.specs.firmwareFamily);
  const parts = c.parts.filter((x) => x.compatibility.some((cp) => cp.printerSlug === p.slug));
  const sources = c.sources.filter((s) => p.sourceIds.includes(s.id));
  const slicers = slicersForPrinter(c, p);

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/printers", label: "Printer library" }, { label: name }]} />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm text-muted">{maker?.name}</p>
          <h1 className="text-[28px] font-semibold sm:text-[32px]">{p.name}</h1>
          <p className="mt-2 text-[16px] text-muted">{p.summary}</p>
          <div className="mt-3">
            <ReviewBadge status={p.verification.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/diagnose?printer=${p.slug}`}>
            Diagnose a problem
            <ArrowRight aria-hidden />
          </LinkButton>
          <SavePrinterButton slug={p.slug} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-lg font-semibold">
              Specifications
            </h2>
            <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {rows.map((r) => (
                <div key={r.label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[220px_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{r.label}</dt>
                  <dd className={r.value ? "text-[15px]" : "text-[15px] text-muted italic"}>{r.value ?? UNKNOWN}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm text-muted">{p.confidenceNotes}</p>
            {p.specSources.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium">Where these figures come from</p>
                <ul className="mt-1 space-y-1">
                  {p.specSources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                        {s.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                      <span className="text-muted"> · accessed {s.accessed}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {p.variants.length > 0 && (
            <section aria-labelledby="variants-heading">
              <h2 id="variants-heading" className="text-lg font-semibold">
                Variants and revisions
              </h2>
              <ul className="mt-3 space-y-2">
                {p.variants.map((v) => (
                  <li key={v.slug} className="rounded-lg border border-line bg-surface p-4">
                    <p className="font-medium">{v.name}</p>
                    <p className="mt-1 text-[15px] text-muted">{v.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.troubleshootingNotes.length > 0 && (
            <section aria-labelledby="notes-heading">
              <h2 id="notes-heading" className="text-lg font-semibold">
                Things to know when troubleshooting
              </h2>
              <ul className="mt-3 space-y-2">
                {p.troubleshootingNotes.map((n) => (
                  <li key={n.title} className="rounded-lg border border-line bg-surface p-4">
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed">{n.body}</p>
                    {n.guideSlugs.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
                        {guidesFor(c, n.guideSlugs).map((g) => (
                          <Link key={g.slug} href={`/guides/${g.slug}?printer=${p.slug}`}>
                            {g.title}
                          </Link>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="text-lg font-semibold">
              Repair guides
            </h2>
            <p className="mt-1 text-sm text-muted">
              {specific.length > 0 ? "Guides written for this model, then general guides." : "General guides. Steps that depend on hardware are matched to this printer's specifications."}
            </p>
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {[...specific, ...general.filter((g) => !specific.includes(g))]
                .filter(fits)
                .sort((a, b) => Number(noteGuides.includes(b)) - Number(noteGuides.includes(a)))
                .map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}?printer=${p.slug}`} className="block px-4 py-3 text-ink no-underline hover:bg-page">
                      <span className="block font-medium text-primary-dark">{g.title}</span>
                      <span className="block text-sm text-muted">{g.summary}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>

          {errors.length > 0 && (
            <section aria-labelledby="errors-heading">
              <h2 id="errors-heading" className="text-lg font-semibold">
                Error messages for this firmware
              </h2>
              <p className="mt-1 text-sm text-muted">General messages from the firmware family this printer uses. Wording can differ on the manufacturer&apos;s own build.</p>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                {errors.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/error-codes/${e.slug}`} className="block px-4 py-2.5 text-ink no-underline hover:bg-page">
                      <span className="font-medium">{e.message}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="docs-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="docs-heading" className="font-semibold">
              Manufacturer documentation
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {p.documentation.map((d) => (
                <li key={d.url}>
                  <a href={d.url} rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-1">
                    {d.label}
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">FixMyPrint is independent and not affiliated with {maker?.name ?? "the manufacturer"}.</p>
          </section>

          <section aria-labelledby="slicer-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="slicer-heading" className="font-semibold">
              Slicer software
            </h2>
            {slicers.length > 0 ? (
              <ul className="mt-2 space-y-2.5 text-sm">
                {slicers.map(({ slicer, link }) => (
                  <li key={slicer.slug}>
                    <Link href={`/slicers/${slicer.slug}`} className="font-medium">
                      {slicer.name}
                    </Link>
                    <span className="text-muted"> · {link.relation === "official" ? `${maker?.name ?? "Manufacturer"}'s own slicer` : `named by ${maker?.name ?? "the manufacturer"}`}</span>
                    {link.note && <p className="text-xs text-muted">{link.note}</p>}
                    <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs">
                      Manufacturer source
                      <ExternalLink className="size-3" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">{maker?.name ?? "The manufacturer"} does not name a slicer for this model in the sources we have checked.</p>
            )}
            <Link href="/slicers" className="mt-3 inline-block text-sm">
              Compare slicers
            </Link>
          </section>

          <section aria-labelledby="maint-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="maint-heading" className="font-semibold">
              Maintenance
            </h2>
            <p className="mt-1 text-sm text-muted">A checklist filtered to this printer&apos;s hardware.</p>
            <Link href={`/maintenance?printer=${p.slug}`} className="mt-2 inline-block text-sm font-medium">
              View maintenance checklist
            </Link>
          </section>

          {parts.length > 0 && (
            <section aria-labelledby="parts-heading" className="rounded-lg border border-line bg-surface p-4">
              <h2 id="parts-heading" className="font-semibold">
                Parts
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {parts.map((x) => (
                  <li key={x.slug}>
                    <Link href={`/parts#${x.slug}`}>{x.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="review-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="review-heading" className="mb-2 font-semibold">
              Sources and review
            </h2>
            <ReviewDetails verification={p.verification} lastVerified={p.lastVerified} />
            <SourceList sources={sources} className="mt-3" />
          </section>
        </aside>
      </div>
    </Container>
  );
}
