import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DiagnosticRunner } from "@/components/diagnose/diagnostic-runner";
import { Breadcrumbs, Container } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { findFlow } from "@/lib/data/selectors";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";

type Params = { flowId: string };

export async function generateStaticParams(): Promise<Params[]> {
  const c = await getContent();
  return c.flows.map((f) => ({ flowId: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { flowId } = await params;
  const flow = findFlow(await getContent(), flowId);
  if (!flow) return {};
  return {
    title: `Diagnose: ${flow.title}`,
    description: flow.summary,
    alternates: { canonical: `/diagnose/${flow.id}` },
  };
}

export default async function DiagnoseFlowPage({ params }: { params: Promise<Params> }) {
  const { flowId } = await params;
  const c = await getContent();
  const flow = findFlow(c, flowId);
  if (!flow) notFound();
  const category = c.categories.find((x) => x.slug === flow.category);
  const guides = c.guides.map((g) => ({ slug: g.slug, title: g.title, summary: g.summary, appliesWhen: g.appliesWhen }));

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { href: "/diagnose", label: "Diagnose" },
          ...(category ? [{ href: `/problems/${category.slug}`, label: category.title }] : []),
          { label: flow.title },
        ]}
      />
      <h1 className="mt-3 mb-5 text-2xl font-semibold sm:text-[28px]">{flow.title}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg border border-line bg-surface" aria-hidden />}>
        <DiagnosticRunner
          flow={flow}
          printers={c.printers}
          printerOptions={printerOptions(c)}
          manufacturerOptions={manufacturerOptions(c)}
          guides={guides}
          safetyNotices={c.safetyNotices}
        />
      </Suspense>
    </Container>
  );
}
