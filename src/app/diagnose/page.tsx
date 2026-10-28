import type { Metadata } from "next";
import { Suspense } from "react";
import { DiagnoseStart } from "@/components/diagnose/diagnose-start";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";
import { assetMap } from "@/lib/visual";

export const metadata: Metadata = {
  title: "Diagnose a 3D printer problem",
  description: "Choose your printer and describe what is happening. Answer a few questions to find the most likely causes and how to fix them.",
  alternates: { canonical: "/diagnose" },
};

export default async function DiagnosePage() {
  const c = await getContent();
  return (
    <>
      <PageHeader
        title="Diagnose a problem"
        description="Choose your printer if you know it, then pick the picture that looks most like your print. Each answer decides the next question, and you can change any answer later."
      />
      <Container className="py-8">
        <Suspense fallback={null}>
          <DiagnoseStart
            categories={c.categories}
            symptoms={c.symptoms.map((s) => ({ slug: s.slug, category: s.category, title: s.title, description: s.description, flowId: s.flowId, images: s.images, printerTypes: s.printerTypes }))}
            assets={assetMap(c.visualAssets, c.symptoms.flatMap((s) => s.images))}
            flows={c.flows.map((f) => ({ id: f.id, title: f.title }))}
            errorCodes={c.errorCodes.map((e) => ({ slug: e.slug, message: e.message, aliases: e.aliases, firmwareLabel: e.firmwareLabel }))}
            printers={printerOptions(c)}
            manufacturers={manufacturerOptions(c)}
          />
        </Suspense>
      </Container>
    </>
  );
}
