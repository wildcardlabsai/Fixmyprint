import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { ENCLOSURE_NEED, GROUP, MOISTURE, range } from "@/lib/filament-labels";

export const metadata: Metadata = {
  title: "Filament settings",
  description: "General starting temperatures, cooling, drying and enclosure needs for PLA, PETG, ABS, ASA, TPU, nylon, PC and fibre-reinforced filaments.",
  alternates: { canonical: "/filament" },
};

export default async function FilamentPage() {
  const c = await getContent();
  return (
    <>
      <PageHeader title="Filament settings" description="General starting points for common materials, with drying, enclosure and nozzle requirements." />
      <Container className="space-y-6 py-8">
        <Notice title="These are starting points, not settings to copy blindly">
          Ranges vary between brands and blends. The filament manufacturer&apos;s data sheet takes priority, and every new spool is worth a quick temperature test. Never set temperatures above your printer&apos;s rated limits.
        </Notice>

        {/* Table on wider screens, cards on phones. */}
        <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">General starting ranges by material</caption>
            <thead className="border-b border-line bg-page text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Material</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Nozzle</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Bed</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Part cooling</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Enclosure</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Moisture uptake</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {c.filaments.map((f) => (
                <tr key={f.slug} className="hover:bg-page">
                  <th scope="row" className="px-4 py-3 font-medium">
                    <Link href={`/filament/${f.slug}`}>{f.name}</Link>
                    <span className="block text-xs font-normal text-muted">{GROUP[f.group]}{f.abrasive ? " · abrasive" : ""}</span>
                  </th>
                  <td className="px-4 py-3 tabular-nums">{range(f.nozzleTempC, " °C")}</td>
                  <td className="px-4 py-3 tabular-nums">{range(f.bedTempC, " °C")}</td>
                  <td className="px-4 py-3 tabular-nums">{range(f.coolingFanPercent, "%")}</td>
                  <td className="px-4 py-3">{ENCLOSURE_NEED[f.enclosure]}</td>
                  <td className="px-4 py-3">{MOISTURE[f.moisture]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {c.filaments.map((f) => (
            <li key={f.slug} className="rounded-lg border border-line bg-surface p-4">
              <Link href={`/filament/${f.slug}`} className="text-[17px] font-semibold">
                {f.name}
              </Link>
              <p className="text-sm text-muted">{f.fullName}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-muted">Nozzle</dt><dd className="tabular-nums">{range(f.nozzleTempC, " °C")}</dd></div>
                <div><dt className="text-muted">Bed</dt><dd className="tabular-nums">{range(f.bedTempC, " °C")}</dd></div>
                <div><dt className="text-muted">Part cooling</dt><dd>{range(f.coolingFanPercent, "%")}</dd></div>
                <div><dt className="text-muted">Enclosure</dt><dd>{ENCLOSURE_NEED[f.enclosure]}</dd></div>
              </dl>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted">
          Manufacturer-specific profiles will be listed on each material&apos;s page once their data sheets have been reviewed. None have been added yet.
        </p>
      </Container>
    </>
  );
}
