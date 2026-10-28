import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuideMeta } from "@/components/guides/guide-meta";
import { GuideRunner } from "@/components/guides/guide-runner";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { SlicerSettingsPanel } from "@/components/slicers/slicer-settings-panel";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { ReviewBadge, ReviewDetails } from "@/components/ui/review-status";
import { SourceList } from "@/components/ui/source-list";
import { getContent } from "@/lib/data/repository";
import { findGuide, printerDisplayName } from "@/lib/data/selectors";
import { assetMap } from "@/lib/visual";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const g = findGuide(await getContent(), slug);
  if (!g) return {};
  return { title: g.title, description: g.summary, alternates: { canonical: `/guides/${g.slug}` } };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = await getContent();
  const guide = findGuide(c, slug);
  if (!guide) notFound();
  const category = c.categories.find((x) => x.slug === guide.category);
  const sources = c.sources.filter((s) => guide.sourceIds.includes(s.id));
  const forPrinters = guide.printerSlugs.map((s) => c.printers.find((p) => p.slug === s)).filter((p) => p !== undefined);

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/guides", label: "Repair guides" }, ...(category ? [{ label: category.title }] : []), { label: guide.title }]} />
      <div className="mt-4 max-w-3xl">
        <h1 className="text-[28px] font-semibold sm:text-[32px]">{guide.title}</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-muted">{guide.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <GuideMeta guide={guide} />
          <ReviewBadge status={guide.verification.status} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="problem-heading" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <h2 id="problem-heading" className="font-semibold">
              The problem
            </h2>
            <p className="mt-1 text-[15px] leading-relaxed">{guide.problem}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-ink">Applies to: </span>
              {forPrinters.length > 0 ? forPrinters.map((p) => printerDisplayName(c, p)).join(", ") : guide.appliesNote}
            </p>
          </section>

          {guide.safety.length > 0 && (
            <section aria-labelledby="safety-heading">
              <h2 id="safety-heading" className="mb-2 font-semibold">
                Before you start
              </h2>
              <SafetyNotices ids={guide.safety} notices={c.safetyNotices} />
            </section>
          )}

          <Suspense fallback={<div className="h-96 animate-pulse rounded-lg border border-line bg-surface" aria-hidden />}>
            <GuideRunner
              guide={guide}
              printers={c.printers.map((p) => ({ slug: p.slug, name: p.name, manufacturer: p.manufacturer, specs: p.specs }))}
              slicers={c.slicers}
              assets={assetMap(c.visualAssets, guide.steps.flatMap((s) => (s.image ? [s.image] : [])))}
              printerNames={Object.fromEntries(c.printers.map((p) => [p.slug, printerDisplayName(c, p)]))}
              safetyNotices={c.safetyNotices}
              flowTitles={Object.fromEntries(c.flows.map((f) => [f.id, f.title]))}
              guideTitles={Object.fromEntries(c.guides.map((g) => [g.slug, g.title]))}
            />
          </Suspense>

          <section aria-labelledby="verify-heading" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <h2 id="verify-heading" className="font-semibold">
              Expected result and how to check it
            </h2>
            <p className="mt-1 text-[15px]">{guide.expectedResult}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              {guide.verificationSteps.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          {(guide.tools.length > 0 || guide.parts.length > 0) && (
            <section aria-labelledby="tools-heading" className="rounded-lg border border-line bg-surface p-4">
              <h2 id="tools-heading" className="font-semibold">
                You will need
              </h2>
              {guide.tools.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {guide.tools.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {guide.parts.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-medium">Parts</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {guide.parts.map((p) => (
                      <li key={p.name}>
                        {p.partSlug ? <Link href={`/parts#${p.partSlug}`}>{p.name}</Link> : p.name}
                        {p.optional && <span className="text-muted"> (only if needed)</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {(guide.slicerSettings.length > 0 || guide.settings.length > 0) && (
            <Suspense fallback={null}>
              <SlicerSettingsPanel
                title="Settings"
                settingKeys={guide.slicerSettings}
                values={guide.settings}
                slicers={c.slicers}
                printers={c.printers.map((p) => ({ slug: p.slug, manufacturer: p.manufacturer }))}
              />
            </Suspense>
          )}

          <section aria-labelledby="review-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="review-heading" className="mb-2 font-semibold">
              Sources and review
            </h2>
            <ReviewDetails verification={guide.verification} />
            <SourceList sources={sources} className="mt-3" />
            <p className="mt-3 text-sm">
              <Link href="/contact">Report a mistake in this guide</Link>
            </p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
