import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { SlicerCompare } from "@/components/slicers/slicer-compare";
import { findManufacturer, manufacturersWithCounts } from "@/lib/data/selectors";
import { SLICER_SETTING_LABELS, slicerSettingKeySchema } from "@/lib/schema";
import { openSourceLabel } from "@/lib/slicer-labels";
import { findSlicer } from "@/lib/slicers";

export const metadata: Metadata = {
  title: "Slicer software",
  description: "OrcaSlicer, Bambu Studio, PrusaSlicer, Cura, Creality Print, FlashPrint and more: which printers each one is for, how they are related, and what common settings are called in each.",
  alternates: { canonical: "/slicers" },
};

export default async function SlicersPage() {
  const c = await getContent();
  const slicers = [...c.slicers].sort((a, b) => a.name.localeCompare(b.name));
  const documented = slicers.filter((s) => Object.keys(s.settings).length > 0);
  const keys = slicerSettingKeySchema.options.filter((k) => documented.some((s) => s.settings[k]));
  const makers = manufacturersWithCounts(c)
    .filter((m) => m.modelCount > 0)
    .map((maker) => {
      const named = (relation: "official" | "supported") =>
        slicers.filter((s) => s.usedBy.some((l) => l.manufacturer === maker.slug && l.relation === relation));
      const official = named("official");
      return { maker, official, supported: named("supported").filter((s) => !official.includes(s)) };
    })
    .sort((a, b) => a.maker.name.localeCompare(b.maker.name));

  return (
    <>
      <PageHeader
        title="Slicer software"
        description="Which slicer each manufacturer makes or names for its printers, how the slicers are related, and what the settings our guides mention are called in each one."
      />
      <Container className="space-y-10 py-8">
        <section aria-labelledby="brand-heading">
          <h2 id="brand-heading" className="text-lg font-semibold">
            Find your printer brand&apos;s slicer
          </h2>
          <p className="mt-1 text-sm text-muted">From each manufacturer&apos;s own pages. Some only name a slicer for certain models; the slicer page lists which.</p>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {makers.map(({ maker, official, supported }) => (
              <li key={maker.slug} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                <span className="font-medium">{maker.name}</span>
                <span className="text-[15px]">
                  {official.length === 0 && supported.length === 0 && <span className="text-muted">No slicer named in the sources we checked</span>}
                  {official.map((s, i) => (
                    <span key={s.slug}>
                      {i > 0 && ", "}
                      <Link href={`/slicers/${s.slug}`} className="font-medium">
                        {s.name}
                      </Link>
                    </span>
                  ))}
                  {official.length > 0 && <span className="text-muted"> (own slicer)</span>}
                  {supported.length > 0 && (
                    <span className="text-muted">
                      {official.length > 0 ? " · also named: " : "Named: "}
                      {supported.map((s, i) => (
                        <span key={s.slug}>
                          {i > 0 && ", "}
                          <Link href={`/slicers/${s.slug}`}>{s.name}</Link>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="all-heading">
          <h2 id="all-heading" className="text-lg font-semibold">
            All slicers
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slicers.map((s) => {
              const parent = findSlicer(c, s.basedOn);
              const makers = [...new Set(s.usedBy.map((l) => l.manufacturer))].map((m) => findManufacturer(c, m)?.name ?? m);
              const official = [...new Set(s.usedBy.filter((l) => l.relation === "official").map((l) => l.manufacturer))].map((m) => findManufacturer(c, m)?.name ?? m);
              return (
                <li key={s.slug} className="min-w-0">
                  <Link href={`/slicers/${s.slug}`} className="block h-full rounded-lg border border-line bg-surface p-4 text-ink no-underline hover:border-primary/50">
                    <span className="block font-semibold text-primary-dark">{s.name}</span>
                    <span className="block text-sm text-muted">{s.developer}</span>
                    <span className="mt-2 block text-sm leading-relaxed">{s.summary}</span>
                    <span className="mt-3 block space-y-0.5 text-xs text-ink/70">
                      {parent && <span className="block">Built on {parent.name}</span>}
                      {openSourceLabel(s) && <span className="block">Open source: {openSourceLabel(s)}</span>}
                      {official.length > 0 && <span className="block">Official slicer for {official.join(", ")}</span>}
                      {makers.length > 0 && official.length === 0 && <span className="block">Named by {makers.join(", ")}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="family-heading" className="max-w-3xl">
          <h2 id="family-heading" className="text-lg font-semibold">
            How they are related
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            Many slicers are built on another one, so they share setting names and behaviour. Where a slicer&apos;s own developer does not document a setting, our guides show
            the name from the project it is built on and say so.
          </p>
          <SlicerTree slicers={slicers} />
          <p className="mt-3 text-sm text-muted">
            {standalone(slicers)
              .map((s) => s.name)
              .join(", ")}
            : their developers do not say they are built on another slicer.
          </p>
        </section>

        <section aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="text-lg font-semibold">
            What common settings are called
          </h2>
          <p className="mt-1 text-sm text-muted">
            Only names given in each developer&apos;s own documentation. Slicers with no published settings reference are left out. Locations can move between versions.
          </p>
          <div className="mt-3">
            <SlicerCompare
              slicers={documented.map((s) => ({ slug: s.slug, name: s.name, names: Object.fromEntries(Object.entries(s.settings).map(([k, v]) => [k, v.name])) }))}
              rows={keys.map((k) => ({ key: k, label: SLICER_SETTING_LABELS[k].label }))}
            />
          </div>
        </section>

        <p className="text-sm text-muted">
          FixMyPrint is not affiliated with any slicer developer. Is a slicer missing, or has a setting moved? <Link href="/contact">Let us know</Link>.
        </p>
      </Container>
    </>
  );
}

const standalone = (slicers: { slug: string; name: string; basedOn: string | null }[]) =>
  slicers.filter((s) => s.basedOn === null && !slicers.some((x) => x.basedOn === s.slug));

function SlicerTree({ slicers, parent = null }: { slicers: { slug: string; name: string; basedOn: string | null }[]; parent?: string | null }) {
  const children = slicers.filter((s) => s.basedOn === parent && (parent !== null || slicers.some((x) => x.basedOn === s.slug)));
  if (children.length === 0) return null;
  return (
    <ul className={parent ? "mt-1 space-y-1 border-l border-line pl-4" : "mt-3 space-y-1 text-[15px]"}>
      {children.map((s) => (
        <li key={s.slug}>
          <Link href={`/slicers/${s.slug}`}>{s.name}</Link>
          <SlicerTree slicers={slicers} parent={s.slug} />
        </li>
      ))}
    </ul>
  );
}
