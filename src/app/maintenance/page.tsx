import type { Metadata } from "next";
import { Suspense } from "react";
import { MaintenanceChecklist } from "@/components/maintenance/maintenance-checklist";
import { Notice } from "@/components/ui/notice";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { printerDisplayName, sortedPrinters } from "@/lib/data/selectors";

export const metadata: Metadata = {
  title: "3D printer maintenance",
  description: "Maintenance checklists for cleaning, belts, lubrication, nozzles, extruders, wiring and firmware, filtered to your printer's hardware.",
  alternates: { canonical: "/maintenance" },
};

export default async function MaintenancePage() {
  const c = await getContent();
  const printers = sortedPrinters(c);
  return (
    <>
      <PageHeader title="Maintenance" description="Regular checks that prevent most common faults. Choose your printer to hide tasks that do not apply to its hardware." />
      <Container className="space-y-5 py-8">
        <Notice title="Your manufacturer's schedule comes first">
          Intervals here are general guidance. Where your printer&apos;s documentation gives a schedule or names a lubricant, follow it.
        </Notice>
        <Suspense fallback={null}>
          <MaintenanceChecklist
            tasks={c.maintenance}
            printers={printers}
            names={Object.fromEntries(printers.map((p) => [p.slug, printerDisplayName(c, p)]))}
            guideTitles={Object.fromEntries(c.guides.map((g) => [g.slug, g.title]))}
            safetyNotices={c.safetyNotices}
          />
        </Suspense>
      </Container>
    </>
  );
}
