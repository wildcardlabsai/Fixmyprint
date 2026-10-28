import type { Metadata } from "next";
import Link from "next/link";
import { SiteSearch } from "@/components/layout/site-search";
import { Container, PageHeader } from "@/components/ui/layout";
import { search, TYPE_LABELS, type SearchType } from "@/lib/search/search";
import { getSearchIndex } from "@/lib/search/server";

export const metadata: Metadata = {
  title: "Search",
  description: "Search printers, problems, error messages, repair guides, filament settings and maintenance procedures.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

const ORDER: SearchType[] = ["error", "symptom", "printer", "guide", "filament", "maintenance", "part", "slicer"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 120) ?? "";
  const results = q ? search(await getSearchIndex(), q, 50) : [];
  const grouped = ORDER.map((type) => ({ type, items: results.filter((r) => r.doc.type === type) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} description="Printers, problems, error messages, repair guides, filament and maintenance.">
        <SiteSearch className="max-w-xl" />
      </PageHeader>
      <Container className="py-8">
        <p className="text-sm text-muted" role="status">
          {q ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Type a printer model, a symptom or the exact wording of an error message."}
        </p>
        {q && results.length === 0 && (
          <div className="mt-4 max-w-xl space-y-2 text-[15px]">
            <p>Nothing matched. Try fewer words, or the exact wording of the error on your printer&apos;s screen.</p>
            <p>
              You can also <Link href="/diagnose">start a diagnosis from a symptom</Link> or browse the <Link href="/error-codes">error message list</Link>.
            </p>
          </div>
        )}
        <div className="mt-6 space-y-8">
          {grouped.map((g) => (
            <section key={g.type} aria-labelledby={`group-${g.type}`}>
              <h2 id={`group-${g.type}`} className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
                {TYPE_LABELS[g.type]}
              </h2>
              <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                {g.items.map(({ doc }) => (
                  <li key={doc.id}>
                    <Link href={doc.href} className="block px-4 py-3 text-ink no-underline hover:bg-page">
                      <span className="block font-medium text-primary-dark">{doc.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{doc.subtitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
