import type { Metadata } from "next";
import { PrinterLibrary, type LibraryPrinter } from "@/components/printers/printer-library";
import { Container, PageHeader } from "@/components/ui/layout";
import { getContent } from "@/lib/data/repository";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";
import { ENCLOSURE_LABEL, EXTRUDER_LABEL, LEVELLING_LABEL, LEVELLING_SHORT } from "@/lib/printer-labels";

export const metadata: Metadata = {
  title: "Printer library",
  description: "Specifications, troubleshooting notes and repair guides for 3D printer models, with unknown values clearly marked.",
  alternates: { canonical: "/printers" },
};

export default async function PrintersPage() {
  const c = await getContent();
  const options = printerOptions(c);
  const printers: LibraryPrinter[] = options.map((o) => {
    const p = c.printers.find((x) => x.slug === o.slug)!;
    const s = p.specs;
    return {
      ...o,
      levelling: s.levelling,
      extruder: s.extruder,
      enclosure: s.enclosure,
      status: p.verification.status,
      facts: [
        s.buildVolumeMm ? `${s.buildVolumeMm.x} × ${s.buildVolumeMm.y} × ${s.buildVolumeMm.z} mm` : null,
        s.levelling ? LEVELLING_SHORT[s.levelling] : null,
        s.extruder ? EXTRUDER_LABEL[s.extruder] : null,
        s.enclosure === "enclosed" ? "Enclosed" : null,
      ].filter((f): f is string => f !== null),
    };
  });

  return (
    <>
      <PageHeader
        title="Printer library"
        description={`${c.printers.length} models documented so far. Each record lists its sources and review status, and specifications we have not confirmed are marked as not yet verified rather than guessed.`}
      />
      <Container className="py-8">
        <PrinterLibrary
          printers={printers}
          manufacturers={manufacturerOptions(c)}
          filters={[
            { key: "levelling", label: "Bed levelling", options: Object.entries(LEVELLING_LABEL).map(([value, label]) => ({ value, label })) },
            { key: "extruder", label: "Extruder", options: Object.entries(EXTRUDER_LABEL).map(([value, label]) => ({ value, label })) },
            { key: "enclosure", label: "Enclosure", options: Object.entries(ENCLOSURE_LABEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </Container>
    </>
  );
}
