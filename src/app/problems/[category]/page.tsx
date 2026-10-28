import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { guidesFor } from "@/lib/data/selectors";

type Params = { category: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const cat = (await getContent()).categories.find((c) => c.slug === category);
  if (!cat) return {};
  return { title: cat.title, description: cat.description, alternates: { canonical: `/problems/${cat.slug}` } };
}

export default async function ProblemCategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const c = await getContent();
  const cat = c.categories.find((x) => x.slug === category);
  if (!cat) notFound();
  const symptoms = c.symptoms.filter((s) => s.category === cat.slug);
  const categoryGuides = c.guides.filter((g) => g.category === cat.slug);
  const flowIds = new Set(symptoms.map((s) => s.flowId).filter(Boolean));
  const errorCodes = c.errorCodes.filter((e) => e.flowId && flowIds.has(e.flowId));

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ href: "/diagnose", label: "Diagnose" }, { label: cat.title }]} />
      <div className="mt-4 flex items-start gap-3">
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-dark">
          <CategoryIcon name={cat.icon} className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px]">{cat.title}</h1>
          <p className="mt-1.5 max-w-2xl text-[16px] text-muted">{cat.description}</p>
        </div>
      </div>

      <section aria-labelledby="symptoms-heading" className="mt-8">
        <h2 id="symptoms-heading" className="text-lg font-semibold">
          Which of these is happening?
        </h2>
        <ul className="mt-3 space-y-3">
          {symptoms.map((s) => {
            const guides = guidesFor(c, s.guideSlugs);
            return (
              <li key={s.slug} id={s.slug} className="rounded-lg border border-line bg-surface p-4 sm:p-5">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {s.flowId ? (
                    <LinkButton href={`/diagnose/${s.flowId}`} size="sm">
                      Diagnose this
                      <ArrowRight aria-hidden />
                    </LinkButton>
                  ) : (
                    <span className="text-sm text-muted">No step-by-step diagnosis for this yet. The guides below cover the usual fixes.</span>
                  )}
                  {guides.map((g) => (
                    <Link key={g.slug} href={`/guides/${g.slug}`} className="text-sm font-medium">
                      {g.title}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {errorCodes.length > 0 && (
        <section aria-labelledby="errors-heading" className="mt-8">
          <h2 id="errors-heading" className="text-lg font-semibold">
            Related error messages
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {errorCodes.map((e) => (
              <li key={e.slug}>
                <Link href={`/error-codes/${e.slug}`} className="block px-4 py-3 text-ink no-underline hover:bg-page">
                  <span className="font-medium">{e.message}</span> <span className="text-sm text-muted">· {e.firmwareLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {categoryGuides.length > 0 && (
        <section aria-labelledby="guides-heading" className="mt-8">
          <h2 id="guides-heading" className="text-lg font-semibold">
            Repair guides
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {categoryGuides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block px-4 py-3 text-ink no-underline hover:bg-page">
                  <span className="block font-medium">{g.title}</span>
                  <span className="block text-sm text-muted">{g.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
