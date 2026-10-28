import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompatChecker } from "@/components/filament/compat-checker";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { Notice } from "@/components/ui/notice";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { ReviewBadge, ReviewDetails } from "@/components/ui/review-status";
import { SourceList } from "@/components/ui/source-list";
import { getContent } from "@/lib/data/repository";
import { printerDisplayName, sortedPrinters } from "@/lib/data/selectors";
import { ENCLOSURE_NEED, GROUP, MOISTURE, range } from "@/lib/filament-labels";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).filaments.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const f = (await getContent()).filaments.find((x) => x.slug === slug);
  if (!f) return {};
  return {
    title: `${f.name} print settings`,
    description: `General starting settings for ${f.name}: nozzle ${range(f.nozzleTempC, " °C")}, bed ${range(f.bedTempC, " °C")}, cooling, drying and enclosure needs.`,
    alternates: { canonical: `/filament/${f.slug}` },
  };
}

export default async function FilamentDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = await getContent();
  const f = c.filaments.find((x) => x.slug === slug);
  if (!f) notFound();
  // Filament only applies to FDM printers.
  const printers = sortedPrinters(c).filter((p) => p.specs.printerType === "fdm");

  const rows = [
    ["Nozzle temperature", range(f.nozzleTempC, " °C")],
    ["Bed temperature", range(f.bedTempC, " °C")],
    ["Part cooling fan", range(f.coolingFanPercent, "%")],
    ["Enclosure", ENCLOSURE_NEED[f.enclosure]],
    ["Moisture uptake", MOISTURE[f.moisture]],
    ["Drying", f.drying ? `${range(f.drying.tempC, " °C")} for ${range(f.drying.hours, " hours")}` : "Follow the base material and the manufacturer's data sheet"],
    ["Abrasive", f.abrasive ? "Yes: use a hardened nozzle" : "No"],
    ["Extruder", f.directDrivePreferred ? "Direct drive strongly preferred" : "Direct drive or Bowden"],
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/filament", label: "Filament settings" }, { label: f.name }]} />
      <div className="mt-4 max-w-3xl">
        <p className="text-sm text-muted">{GROUP[f.group]}</p>
        <h1 className="text-[28px] font-semibold sm:text-[32px]">{f.name}</h1>
        <p className="text-[15px] text-muted">{f.fullName}</p>
        <p className="mt-3 text-[16px] leading-relaxed">{f.summary}</p>
        <ReviewBadge status={f.verification.status} className="mt-3" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="ranges-heading">
            <h2 id="ranges-heading" className="text-lg font-semibold">
              General starting ranges
            </h2>
            <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[200px_1fr]">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="text-[15px] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm text-muted">These are general ranges, not a recommendation from any filament manufacturer. Calibrate for each brand and spool.</p>
          </section>

          <section aria-labelledby="notes-heading" className="space-y-3">
            <h2 id="notes-heading" className="text-lg font-semibold">
              Printing notes
            </h2>
            <p className="text-[15px]">
              <span className="font-medium">Build surface: </span>
              {f.bedSurfaceNotes}
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
              {f.printingNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            {f.safetyNotes.map((n) => (
              <Notice key={n} tone="caution" title="Safety">
                {n}
              </Notice>
            ))}
            <SafetyNotices ids={f.safety} notices={c.safetyNotices} />
          </section>

          <section aria-labelledby="mfr-heading">
            <h2 id="mfr-heading" className="text-lg font-semibold">
              Manufacturer-specific settings
            </h2>
            {f.manufacturerProfiles.length === 0 ? (
              <p className="mt-2 text-[15px] text-muted">No manufacturer profiles have been reviewed for {f.name} yet. Use the temperatures printed on your spool or the brand&apos;s data sheet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {f.manufacturerProfiles.map((m) => (
                  <li key={`${m.brand}-${m.product}`} className="rounded-lg border border-line bg-surface p-3 text-sm">
                    <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium">
                      {m.brand} {m.product}
                    </a>
                    <p className="text-muted">
                      Nozzle {range(m.nozzleTempC, " °C")} · Bed {range(m.bedTempC, " °C")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-sm">
            Problems printing {f.name}? Try <Link href="/diagnose/stringing-and-surface">stringing and surface</Link>, <Link href="/diagnose/warping-and-dimensions">warping</Link> or <Link href="/guides/dry-filament">drying filament</Link>.
          </p>
        </div>

        <aside className="space-y-5">
          <CompatChecker filament={f} printers={printers} names={Object.fromEntries(printers.map((p) => [p.slug, printerDisplayName(c, p)]))} />
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 font-semibold">Sources and review</h2>
            <ReviewDetails verification={f.verification} />
            <SourceList sources={c.sources.filter((s) => f.sourceIds.includes(s.id))} className="mt-3" />
          </section>
        </aside>
      </div>
    </Container>
  );
}
