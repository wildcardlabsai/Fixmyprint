import type { Metadata } from "next";
import Link from "next/link";
import { GuideMeta } from "@/components/guides/guide-meta";
import { CategoryIcon } from "@/components/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Repair guides",
  description: "Step-by-step 3D printer repair guides with safety notes, required tools and steps matched to your printer's hardware.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const c = await getContent();
  const groups = c.categories.map((cat) => ({ cat, guides: c.guides.filter((g) => g.category === cat.slug) })).filter((g) => g.guides.length > 0);

  return (
    <>
      <PageHeader
        title="Repair guides"
        description="Each guide lists the tools, safety precautions and steps. Where hardware differs between printers, choose your printer or levelling system and the steps adjust."
      />
      <Container className="space-y-8 py-8">
        {groups.map(({ cat, guides }) => (
          <section key={cat.slug} aria-labelledby={`g-${cat.slug}`}>
            <h2 id={`g-${cat.slug}`} className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CategoryIcon name={cat.icon} className="size-5 text-primary-dark" />
              {cat.title}
            </h2>
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="flex flex-col gap-1.5 px-4 py-3.5 text-ink no-underline hover:bg-page sm:flex-row sm:items-center sm:gap-6">
                    <span className="flex-1">
                      <span className="block font-medium text-primary-dark">{g.title}</span>
                      <span className="block text-sm text-muted">{g.summary}</span>
                    </span>
                    <GuideMeta guide={g} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </>
  );
}
