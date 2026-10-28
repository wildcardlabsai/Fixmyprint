import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SafetyNotices } from "@/components/safety/safety-notices";
import { LinkButton } from "@/components/ui/button";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { ReviewDetails } from "@/components/ui/review-status";
import { SourceList } from "@/components/ui/source-list";
import { getContent } from "@/lib/data/repository";
import { findFlow } from "@/lib/data/selectors";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getContent()).errorCodes.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const e = (await getContent()).errorCodes.find((x) => x.slug === slug);
  if (!e) return {};
  return { title: `“${e.message}” error (${e.firmwareLabel})`, description: e.meaning, alternates: { canonical: `/error-codes/${e.slug}` } };
}

export default async function ErrorCodePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = await getContent();
  const e = c.errorCodes.find((x) => x.slug === slug);
  if (!e) notFound();
  const flow = e.flowId ? findFlow(c, e.flowId) : null;

  return (
    <Container className="max-w-3xl py-8">
      <Breadcrumbs items={[{ href: "/error-codes", label: "Error messages" }, { label: e.message }]} />
      <p className="mt-4 text-sm text-muted">{e.firmwareLabel}</p>
      <h1 className="font-mono text-[26px] font-semibold sm:text-[30px]">{e.message}</h1>
      {e.aliases.length > 0 && <p className="mt-1 text-sm text-muted">Also shown as: {e.aliases.join(", ")}</p>}

      <section className="mt-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">What it means</h2>
          <p className="mt-1 text-[16px] leading-relaxed">{e.meaning}</p>
        </div>
        <SafetyNotices ids={e.safety} notices={c.safetyNotices} />
        <div>
          <h2 className="text-lg font-semibold">What to check first</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px]">
            {e.firstSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        {flow && (
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="font-medium">Work through it step by step</p>
            <p className="mt-1 text-sm text-muted">{flow.summary}</p>
            <LinkButton href={`/diagnose/${flow.id}`} className="mt-3">
              Diagnose: {flow.title}
              <ArrowRight aria-hidden />
            </LinkButton>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold">Sources and review</h2>
        <ReviewDetails verification={e.verification} />
        <SourceList sources={c.sources.filter((s) => e.sourceIds.includes(s.id))} className="mt-3" />
      </section>
    </Container>
  );
}
