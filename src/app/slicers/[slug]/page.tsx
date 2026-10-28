import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { ReviewBadge, ReviewDetails } from "@/components/ui/review-status";
import { getContent } from "@/lib/data/repository";
import { findManufacturer, printerDisplayName } from "@/lib/data/selectors";
import { UNKNOWN } from "@/lib/printer-labels";
import { SLICER_SETTING_LABELS, slicerSettingKeySchema } from "@/lib/schema";
import { openSourceLabel, platformList } from "@/lib/slicer-labels";
import { ancestry, derivedSlicers, findSlicer, printersForSlicer, resolveSetting } from "@/lib/slicers";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).slicers.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = findSlicer(await getContent(), slug);
  if (!s) return {};
  return {
    title: `${s.name}: printers, settings and troubleshooting`,
    description: `${s.summary} Where to find retraction, flow, seam and other settings in ${s.name}.`,
    alternates: { canonical: `/slicers/${s.slug}` },
  };
}

const External = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
    {children}
    <ExternalLink className="size-3.5" aria-hidden />
    <span className="sr-only">(opens in a new tab)</span>
  </a>
);

export default async function SlicerPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = await getContent();
  const s = findSlicer(c, slug);
  if (!s) notFound();
  const parents = ancestry(c, s);
  const derived = derivedSlicers(c, s);
  const printers = printersForSlicer(c, s);
  const byMaker = [...new Set(printers.map((x) => x.printer.manufacturer))].map((m) => ({
    maker: findManufacturer(c, m),
    items: printers.filter((x) => x.printer.manufacturer === m),
  }));

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Developer", value: s.developer },
    { label: "Built on", value: parents.length ? parents.map((x, i) => <span key={x.slug}>{i > 0 && " ← "}<Link href={`/slicers/${x.slug}`}>{x.name}</Link></span>) : null },
    { label: "Lineage", value: s.lineage ?? null },
    { label: "Formerly called", value: s.formerNames.length ? s.formerNames.join(", ") : null },
    { label: "Open source", value: openSourceLabel(s) },
    { label: "Platforms", value: platformList(s) },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/slicers", label: "Slicers" }, { label: s.name }]} />
      <div className="mt-4 max-w-3xl">
        <h1 className="text-[28px] font-semibold sm:text-[32px]">{s.name}</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-muted">{s.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ReviewBadge status={s.verification.status} />
          <span className="text-sm">
            <External href={s.url}>Official page and download</External>
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="text-lg font-semibold">
              About
            </h2>
            <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {facts.map((f) => (
                <div key={f.label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{f.label}</dt>
                  <dd className={f.value ? "text-[15px]" : "text-[15px] text-muted italic"}>{f.value ?? UNKNOWN}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="settings-heading">
            <h2 id="settings-heading" className="text-lg font-semibold">
              Where common settings are
            </h2>
            <p className="mt-1 text-sm text-muted">
              The settings our guides refer to, as named in {s.developer}&apos;s documentation. Locations can move between versions.
            </p>
            <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {slicerSettingKeySchema.options.map((k) => {
                const r = resolveSetting(c, s, k);
                return (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
                    <dt className="text-sm">
                      <span className="block font-medium">{SLICER_SETTING_LABELS[k].label}</span>
                      <span className="block text-xs text-muted">{SLICER_SETTING_LABELS[k].purpose}</span>
                    </dt>
                    {r ? (
                      <dd className="text-[15px]">
                        <span className="block font-medium">{r.setting.name}</span>
                        {r.setting.location && !r.inherited && <span className="block text-sm text-muted">{r.setting.location}</span>}
                        {r.inherited && (
                          <span className="mt-0.5 block text-xs">
                            <span className="font-medium">Not confirmed for {s.name}.</span> Name taken from {r.documentedBy.name}, which it is built on; it may differ or sit elsewhere.
                          </span>
                        )}
                        {r.setting.note && !r.inherited && <span className="mt-0.5 block text-xs text-muted">{r.setting.note}</span>}
                        <span className="mt-0.5 block text-xs">
                          <External href={r.setting.sourceUrl}>Source</External>
                        </span>
                      </dd>
                    ) : (
                      <dd className="text-[15px] text-muted italic">Not documented</dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </section>

          {s.calibrationTools.length > 0 && (
            <section aria-labelledby="cal-heading">
              <h2 id="cal-heading" className="text-lg font-semibold">
                Built-in calibration
              </h2>
              <ul className="mt-2 space-y-1 text-[15px]">
                {s.calibrationTools.map((t) => (
                  <li key={t.name}>
                    <External href={t.sourceUrl}>{t.name}</External>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {s.notes.length > 0 && (
            <section aria-labelledby="notes-heading">
              <h2 id="notes-heading" className="text-lg font-semibold">
                Good to know
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                {s.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="printers-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="printers-heading" className="font-semibold">
              Printers in our library
            </h2>
            {byMaker.length > 0 ? (
              <div className="mt-2 space-y-3 text-sm">
                {byMaker.map(({ maker, items }) => {
                  const link = items[0]!.link;
                  return (
                    <div key={maker?.slug ?? items[0]!.printer.manufacturer}>
                      <p className="font-medium">
                        {maker?.name} <span className="font-normal text-muted">· {link.relation === "official" ? "official slicer" : "named by the manufacturer"}</span>
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {items.map(({ printer }) => (
                          <li key={printer.slug}>
                            <Link href={`/printers/${printer.slug}`}>{printerDisplayName(c, printer)}</Link>
                          </li>
                        ))}
                      </ul>
                      {link.note && <p className="mt-1 text-xs text-muted">{link.note}</p>}
                      <p className="mt-1 text-xs">
                        <External href={link.sourceUrl}>Manufacturer source</External>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">No manufacturer in our library names this slicer for its printers.</p>
            )}
          </section>

          {derived.length > 0 && (
            <section aria-labelledby="derived-heading" className="rounded-lg border border-line bg-surface p-4">
              <h2 id="derived-heading" className="font-semibold">
                Built on {s.name}
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {derived.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/slicers/${d.slug}`}>{d.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="review-heading" className="rounded-lg border border-line bg-surface p-4">
            <h2 id="review-heading" className="mb-2 font-semibold">
              Sources and review
            </h2>
            <ReviewDetails verification={s.verification} />
            <ul className="mt-3 space-y-1 text-sm">
              {s.sources.map((x) => (
                <li key={x.url}>
                  <External href={x.url}>{x.label}</External>
                  <span className="text-muted"> · accessed {x.accessed}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">FixMyPrint is independent and not affiliated with {s.developer}.</p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
