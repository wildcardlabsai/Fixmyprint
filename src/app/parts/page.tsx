import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { Container, PageHeader } from "@/components/ui/layout";
import { ReviewBadge } from "@/components/ui/review-status";
import { getContent } from "@/lib/data/repository";
import { findPrinter, printerDisplayName } from "@/lib/data/selectors";

export const metadata: Metadata = {
  title: "Parts",
  description: "Replacement part types with compatibility notes and links to manufacturer sources.",
  alternates: { canonical: "/parts" },
};

const STATUS = {
  "manufacturer-listed": "Listed by the manufacturer",
  reported: "Reported compatible",
  unverified: "Compatibility not yet verified",
} as const;

export default async function PartsPage() {
  const c = await getContent();
  return (
    <>
      <PageHeader title="Parts" description="Common replacement parts and which printers they fit. This directory is at an early stage." />
      <Container className="space-y-5 py-8">
        <Notice title="Check before you buy">
          Compatibility shown here has not yet been verified against manufacturer parts listings. Confirm the exact part with your printer&apos;s manufacturer. FixMyPrint does not sell parts and links only to manufacturer sites.
        </Notice>
        <ul className="space-y-3">
          {c.parts.map((part) => (
            <li key={part.slug} id={part.slug} className="scroll-mt-24 rounded-lg border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-[17px] font-semibold">{part.name}</h2>
                <ReviewBadge status={part.verification.status} />
              </div>
              <p className="mt-1 text-[15px] text-muted">{part.description}</p>
              {part.specs.length > 0 && (
                <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[200px_1fr]">
                  {part.specs.map((s) => (
                    <div key={s.label} className="contents">
                      <dt className="text-muted">{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <h3 className="mt-3 text-sm font-semibold">Fits</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {part.compatibility.map((x) => {
                  const p = findPrinter(c, x.printerSlug);
                  return (
                    <li key={x.printerSlug}>
                      {p ? <Link href={`/printers/${p.slug}`}>{printerDisplayName(c, p)}</Link> : x.printerSlug}{" "}
                      <span className="text-muted">· {STATUS[x.status]}</span>
                      {x.note && <span className="block text-xs text-muted">{x.note}</span>}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {part.replacementGuideSlug && <Link href={`/guides/${part.replacementGuideSlug}`}>Replacement guide</Link>}
                {part.supplier && (
                  <a href={part.supplier.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                    {part.supplier.label}
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
