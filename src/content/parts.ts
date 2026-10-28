import type { PartInput } from "@/lib/schema";
import { seedVerification } from "./shared";

/**
 * A deliberately small starting set. Parts are generic component types with
 * compatibility notes, not products. Supplier links go to the manufacturer only.
 */
export const partInputs: PartInput[] = [
  {
    slug: "mk8-style-nozzle",
    name: "MK8-style nozzle",
    category: "nozzle",
    description: "Short nozzle with an M6 thread used on many Creality printers.",
    specs: [
      { label: "Thread", value: "M6" },
      { label: "Common sizes", value: "0.2–1.0 mm; 0.4 mm is standard" },
    ],
    compatibility: [{ printerSlug: "creality-ender-3-v2", status: "unverified", note: "Check against the manufacturer's spare parts listing before buying." }],
    replacementGuideSlug: "clear-a-blocked-nozzle",
    supplier: { label: "Creality website", url: "https://www.creality.com/", kind: "manufacturer-store" },
    sourceIds: ["creality-site"],
    verification: seedVerification(),
  },
  {
    slug: "e3d-v6-compatible-nozzle",
    name: "E3D V6-compatible nozzle",
    category: "nozzle",
    description: "Nozzle with an M6 thread and the longer V6 body, used by the hotend on the MK3S+.",
    specs: [
      { label: "Thread", value: "M6" },
      { label: "Common sizes", value: "0.25–0.8 mm; 0.4 mm is standard" },
    ],
    compatibility: [{ printerSlug: "prusa-mk3s-plus", status: "unverified" }],
    replacementGuideSlug: "clear-a-blocked-nozzle",
    supplier: { label: "Prusa Research", url: "https://www.prusa3d.com/", kind: "manufacturer-store" },
    sourceIds: ["prusa-kb"],
    verification: seedVerification(),
  },
  {
    slug: "bowden-ptfe-tube",
    name: "Bowden PTFE tube",
    category: "tubing",
    description: "PTFE tube that guides filament from the extruder to the hotend on Bowden printers.",
    specs: [{ label: "Typical size for 1.75 mm filament", value: "4 mm outer, about 2 mm inner diameter" }],
    compatibility: [
      { printerSlug: "creality-ender-3-v2", status: "unverified", note: "Measure your existing tube before replacing it." },
      { printerSlug: "prusa-mini-plus", status: "unverified", note: "Measure your existing tube before replacing it." },
    ],
    replacementGuideSlug: "clear-a-blocked-nozzle",
    supplier: null,
    sourceIds: ["editorial"],
    verification: seedVerification(undefined, ["Tube length and fittings differ between models."]),
  },
  {
    slug: "bambu-p1-hotend",
    name: "P1 series hotend assembly",
    category: "hotend",
    description: "On the P1S the nozzle is replaced as part of the hotend assembly.",
    specs: [{ label: "Stock nozzle", value: "0.4 mm" }],
    compatibility: [{ printerSlug: "bambu-lab-p1s", status: "unverified" }],
    supplier: { label: "Bambu Lab Wiki", url: "https://wiki.bambulab.com/", kind: "manufacturer-docs" },
    sourceIds: ["bambu-wiki"],
    verification: seedVerification(),
  },
];
