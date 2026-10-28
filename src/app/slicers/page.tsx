import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { findManufacturer } from "@/lib/data/selectors";
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

  return (
    <>
      <PageHeader
        title="Slicer software"
        description="Which slicer each manufacturer makes or names for its printers, how the slicers are related, and what the settings our guides mention are called in each one."
      />
      <Container className="space-y-10 py-8">
        <section aria-labelledby="all-heading">
          <h2 id="all-heading" className="sr-only">
            All slicers
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <span className="mt-3 block space-y-0.5 text-xs text-muted">
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
          <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Setting names by slicer</caption>
              <thead className="border-b border-line bg-page/60">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Setting
                  </th>
                  {documented.map((s) => (
                    <th key={s.slug} scope="col" className="px-3 py-2.5 font-semibold">
                      <Link href={`/slicers/${s.slug}`}>{s.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {keys.map((k) => (
                  <tr key={k}>
                    <th scope="row" className="px-3 py-2.5 align-top font-medium">
                      {SLICER_SETTING_LABELS[k].label}
                    </th>
                    {documented.map((s) => (
                      <td key={s.slug} className="px-3 py-2.5 align-top">
                        {s.settings[k] ? s.settings[k].name : <span className="text-muted">Not documented</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
