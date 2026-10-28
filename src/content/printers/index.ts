import type { Manufacturer, PrinterModel } from "@/lib/schema";
import { bambuLabPrinters } from "./bambu-lab";
import { crealityPrinters } from "./creality";
import { anycubicPrinters, artilleryPrinters, elegooPrinters, flashforgePrinters, qidiPrinters, raise3dPrinters, sovolPrinters, ultimakerPrinters } from "./others";
import { prusaPrinters } from "./prusa-research";

export const manufacturers: Manufacturer[] = [
  { slug: "bambu-lab", name: "Bambu Lab", website: "https://bambulab.com/", supportUrl: "https://wiki.bambulab.com/", aliases: ["bambu", "bambulab"] },
  { slug: "creality", name: "Creality", website: "https://www.creality.com/", supportUrl: "https://www.creality.com/", aliases: ["creality3d"] },
  { slug: "prusa-research", name: "Prusa Research", website: "https://www.prusa3d.com/", supportUrl: "https://help.prusa3d.com/", aliases: ["prusa", "original prusa"] },
  { slug: "anycubic", name: "Anycubic", website: "https://www.anycubic.com/", supportUrl: "https://store.anycubic.com/pages/firmware-software", aliases: [] },
  { slug: "elegoo", name: "Elegoo", website: "https://www.elegoo.com/", supportUrl: null, aliases: [] },
  { slug: "qidi-tech", name: "QIDI Tech", website: "https://qidi3d.com/", supportUrl: null, aliases: ["qidi"] },
  { slug: "sovol", name: "Sovol", website: "https://www.sovol3d.com/", supportUrl: null, aliases: ["sovol3d"] },
  { slug: "flashforge", name: "Flashforge", website: "https://www.flashforge.com/", supportUrl: null, aliases: ["flash forge"] },
  { slug: "artillery", name: "Artillery", website: "https://www.artillery3d.com/", supportUrl: "https://www.artillery3d.com/pages/firmware-download", aliases: ["artillery3d"] },
  { slug: "raise3d", name: "Raise3D", website: "https://www.raise3d.com/", supportUrl: "https://support.raise3d.com/", aliases: ["raise 3d"] },
  { slug: "ultimaker", name: "UltiMaker", website: "https://ultimaker.com/", supportUrl: "https://support.ultimaker.com/", aliases: ["ultimaker"] },
];

export const printers: PrinterModel[] = [
  ...bambuLabPrinters,
  ...prusaPrinters,
  ...crealityPrinters,
  ...anycubicPrinters,
  ...elegooPrinters,
  ...qidiPrinters,
  ...sovolPrinters,
  ...flashforgePrinters,
  ...artilleryPrinters,
  ...raise3dPrinters,
  ...ultimakerPrinters,
];
