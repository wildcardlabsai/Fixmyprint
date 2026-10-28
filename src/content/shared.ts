import type { SafetyNotice, SourceReference, Verification } from "@/lib/schema";

/**
 * Every seeded record starts as "unreviewed". Promote a record only after a named
 * reviewer has checked it against the cited sources (see docs/CONTENT.md).
 */
export const seedVerification = (notes?: string, knownLimitations: string[] = []): Verification => ({
  status: "unreviewed",
  author: "FixMyPrint editorial (seed content)",
  reviewedBy: null,
  lastReviewed: null,
  notes,
  knownLimitations,
});

export const sources: SourceReference[] = [
  { id: "editorial", title: "FixMyPrint editorial: general FDM troubleshooting practice", publisher: "FixMyPrint", kind: "editorial", note: "Widely documented general practice. Not specific to any manufacturer." },
  { id: "prusa-kb", title: "Prusa Knowledge Base", publisher: "Prusa Research", url: "https://help.prusa3d.com/", kind: "manufacturer-docs" },
  { id: "bambu-wiki", title: "Bambu Lab Wiki", publisher: "Bambu Lab", url: "https://wiki.bambulab.com/", kind: "manufacturer-docs" },
  { id: "bambu-site", title: "Bambu Lab product and specification pages", publisher: "Bambu Lab", url: "https://bambulab.com/en/compare", kind: "manufacturer-site" },
  { id: "prusa-site", title: "Prusa Research product pages", publisher: "Prusa Research", url: "https://www.prusa3d.com/", kind: "manufacturer-site" },
  { id: "creality-site", title: "Creality product and support pages", publisher: "Creality", url: "https://www.creality.com/", kind: "manufacturer-site" },
  { id: "anycubic-site", title: "Anycubic product pages", publisher: "Anycubic", url: "https://store.anycubic.com/", kind: "manufacturer-site" },
  { id: "elegoo-site", title: "Elegoo product pages", publisher: "Elegoo", url: "https://www.elegoo.com/", kind: "manufacturer-site" },
  { id: "qidi-site", title: "QIDI Tech product pages", publisher: "QIDI Tech", url: "https://qidi3d.com/", kind: "manufacturer-site" },
  { id: "sovol-site", title: "Sovol product pages", publisher: "Sovol", url: "https://www.sovol3d.com/", kind: "manufacturer-site" },
  { id: "flashforge-site", title: "Flashforge product pages", publisher: "Flashforge", url: "https://www.flashforge.com/", kind: "manufacturer-site" },
  { id: "artillery-site", title: "Artillery 3D website", publisher: "Artillery", url: "https://www.artillery3d.com/", kind: "manufacturer-site" },
  { id: "raise3d-site", title: "Raise3D technical specifications", publisher: "Raise3D", url: "https://www.raise3d.com/", kind: "manufacturer-docs" },
  { id: "ultimaker-site", title: "UltiMaker product pages and manuals", publisher: "UltiMaker", url: "https://ultimaker.com/", kind: "manufacturer-site" },
  { id: "marlin-docs", title: "Marlin Firmware documentation", publisher: "Marlin Firmware project", url: "https://marlinfw.org/docs/", kind: "firmware-docs" },
  { id: "marlin-m303", title: "Marlin G-code M303: PID autotune", publisher: "Marlin Firmware project", url: "https://marlinfw.org/docs/gcode/M303.html", kind: "firmware-docs" },
  { id: "marlin-m851", title: "Marlin G-code M851: XYZ probe offset", publisher: "Marlin Firmware project", url: "https://marlinfw.org/docs/gcode/M851.html", kind: "firmware-docs" },
  { id: "marlin-g29", title: "Marlin G-code G29: bed levelling", publisher: "Marlin Firmware project", url: "https://marlinfw.org/docs/gcode/G029.html", kind: "firmware-docs" },
  { id: "klipper-config", title: "Klipper configuration reference", publisher: "Klipper project", url: "https://www.klipper3d.org/Config_Reference.html", kind: "firmware-docs" },
  { id: "klipper-faq", title: "Klipper frequently asked questions", publisher: "Klipper project", url: "https://www.klipper3d.org/FAQ.html", kind: "firmware-docs" },
  { id: "klipper-probe", title: "Klipper probe calibration", publisher: "Klipper project", url: "https://www.klipper3d.org/Probe_Calibrate.html", kind: "firmware-docs" },
  { id: "klipper-rotation", title: "Klipper rotation distance", publisher: "Klipper project", url: "https://www.klipper3d.org/Rotation_Distance.html", kind: "firmware-docs" },
];

export const safetyNotices: SafetyNotice[] = [
  {
    id: "hot-surfaces",
    level: "warning",
    title: "Hot surfaces",
    body: "The nozzle and heater block can exceed 200 °C and the bed can exceed 100 °C. Let them cool before touching them, and if a step needs the hotend hot, use tools rather than fingers and keep cables and filament clear of the heater block.",
  },
  {
    id: "moving-parts",
    level: "caution",
    title: "Moving parts",
    body: "Keep fingers, hair and loose clothing away from belts, pulleys and the toolhead while the motors are powered. Disable the steppers before moving axes by hand.",
  },
  {
    id: "power-off-before-work",
    level: "warning",
    title: "Switch off and unplug first",
    body: "Turn the printer off and unplug it from the wall before opening covers, unplugging internal connectors or touching wiring. Wait a few minutes after unplugging: power supplies can hold a charge for a short time.",
  },
  {
    id: "mains-electrical",
    level: "danger",
    title: "Mains electricity: refer to a qualified person",
    body: "Never work on the power supply, mains wiring or mains terminals, and never work on any part with the printer plugged in. If a fault involves the power supply, mains cable or a burnt smell, stop using the printer and contact the manufacturer or a qualified electrician.",
  },
  {
    id: "never-bypass-protection",
    level: "danger",
    title: "Do not disable safety protection",
    body: "Thermal runaway protection, MINTEMP/MAXTEMP checks and heating timeouts exist to stop fires. Never disable or loosen them to make an error go away. Find and fix the cause instead.",
  },
  {
    id: "fumes-ventilation",
    level: "caution",
    title: "Ventilation",
    body: "Some materials, especially ABS, ASA and PC, release fumes and fine particles while printing. Print in a ventilated room or use an enclosure with filtration, and avoid sitting next to the printer for long periods.",
  },
  {
    id: "sharp-tools",
    level: "caution",
    title: "Sharp tools",
    body: "Scrapers, flush cutters and acupuncture needles are sharp. Cut and scrape away from your body and hands.",
  },
  {
    id: "solvents",
    level: "caution",
    title: "Cleaning solvents",
    body: "Isopropyl alcohol is flammable. Use it only on a cool bed, in a ventilated room, away from heat sources. Do not use acetone on PEI or coated surfaces unless the manufacturer says it is safe.",
  },
  {
    id: "firmware-flashing",
    level: "caution",
    title: "Firmware updates",
    body: "Use only firmware published by the manufacturer for your exact model and mainboard revision. Do not switch off the printer during an update. Flashing the wrong file can leave the printer unusable until it is recovered.",
  },
];
