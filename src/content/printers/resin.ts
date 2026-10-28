import type { PrinterModel } from "@/lib/schema";
import { printer, volume } from "./helpers";

/**
 * MSLA resin printers. Figures come from the manufacturers' own product and help
 * pages; FDM-only fields (hotend, extruder, bed temperature) do not apply.
 */
export const resinPrinters: PrinterModel[] = [
  printer({
    slug: "elegoo-saturn-4-ultra-16k",
    manufacturer: "elegoo",
    name: "Saturn 4 Ultra 16K",
    family: "Saturn",
    aliases: ["saturn 4 ultra 16k", "saturn 4 ultra"],
    summary: "10-inch 16K MSLA resin printer with automatic levelling and a tilting vat release.",
    specs: {
      printerType: "msla",
      buildVolumeMm: volume(211.68, 118.37, 220),
      levelling: "automatic",
      levellingDetail: "Elegoo lists automatic levelling with no manual adjustment.",
      resin: { lcd: "10-inch 16K monochrome LCD (15120 × 6230)", xyResolution: "14 × 19 µm", layerHeightMm: { min: 0.01, max: 0.2 }, lightSource: null },
    },
    sources: [{ label: "Saturn 4 Ultra 16K product page", url: "https://us.elegoo.com/products/saturn-4-ultra-16k-10inch-monochrome-lcd-resin-3d-printer" }],
    gaps: ["One regional Elegoo page also shows the larger build volume of the non-16K Saturn 4 Ultra; the 16K figures are used here."],
    sourceId: "elegoo-site",
  }),
  printer({
    slug: "elegoo-mars-5-ultra",
    manufacturer: "elegoo",
    name: "Mars 5 Ultra",
    family: "Mars",
    aliases: ["mars 5 ultra"],
    summary: "Compact 7-inch 9K MSLA resin printer with one-click levelling by a mechanical sensor.",
    specs: {
      printerType: "msla",
      buildVolumeMm: volume(153.36, 77.76, 165),
      levelling: "automatic",
      levellingDetail: "One-click levelling, using a mechanical sensor to level the build plate.",
      resin: { lcd: "7-inch 9K monochrome LCD (8520 × 4320)", xyResolution: "18 × 18 µm", layerHeightMm: { min: 0.01, max: 0.2 }, lightSource: "405 nm COB" },
      connectivity: ["Wi-Fi", "USB"],
    },
    sources: [{ label: "Mars 5 Ultra product page", url: "https://us.elegoo.com/products/mars-5-ultra-9k-7inch-monochrome-lcd-resin-3d-printer" }],
    sourceId: "elegoo-site",
  }),
  printer({
    slug: "anycubic-photon-mono-m7-pro",
    manufacturer: "anycubic",
    name: "Photon Mono M7 Pro",
    family: "Photon Mono",
    aliases: ["m7 pro", "photon m7 pro"],
    summary: "10.1-inch 14K MSLA resin printer marketed as levelling-free, with automatic zeroing.",
    specs: {
      printerType: "msla",
      buildVolumeMm: volume(223, 126, 230),
      levelling: "automatic",
      levellingDetail: "Marketed by Anycubic as levelling-free, with automatic zeroing instead of manual levelling.",
      resin: { lcd: "10.1-inch 14K monochrome LCD (13320 × 5120)", xyResolution: "16.8 × 24.8 µm", layerHeightMm: { min: 0.01, max: 0.15 }, lightSource: null },
    },
    sources: [
      { label: "Photon Mono M7 Pro product page", url: "https://store.anycubic.com/products/photon-mono-m7-pro" },
      { label: "Photon Mono M7 Pro wiki", url: "https://wiki.anycubic.com/en/resin-3d-printer/photon-mono-m7-pro" },
    ],
    sourceId: "anycubic-site",
  }),
  printer({
    slug: "anycubic-photon-mono-4",
    manufacturer: "anycubic",
    name: "Photon Mono 4",
    family: "Photon Mono",
    aliases: ["photon mono 4", "mono 4"],
    summary: "Entry-level 10K MSLA resin printer with four-point manual levelling.",
    specs: {
      printerType: "msla",
      buildVolumeMm: volume(153.4, 87, 165),
      levelling: "manual",
      levellingDetail: "Four-point manual levelling.",
      resin: { lcd: "10K monochrome LCD", xyResolution: "17 × 17 µm", layerHeightMm: null, lightSource: null },
    },
    sources: [{ label: "Photon Mono 4 product page", url: "https://store.anycubic.com/products/photon-mono-4" }],
    gaps: ["Anycubic gives a 0.02 mm minimum layer height but no maximum, so the range is left blank.", "Anycubic's listings disagree on power-loss recovery."],
    sourceId: "anycubic-site",
  }),
  printer({
    slug: "phrozen-sonic-mini-8k-s",
    manufacturer: "phrozen",
    name: "Sonic Mini 8K S",
    family: "Sonic Mini",
    aliases: ["sonic mini 8k s", "mini 8k s"],
    summary: "Compact 7.1-inch 8K MSLA resin printer, levelled by hand with a sheet of paper.",
    specs: {
      printerType: "msla",
      buildVolumeMm: volume(165, 72, 170),
      levelling: "manual",
      levellingDetail: "Z-axis calibration: the plate is lowered onto a sheet of paper and its four screws are tightened by hand.",
      resin: { lcd: "7.1-inch 8K monochrome LCD", xyResolution: "22 µm", layerHeightMm: { min: 0.01, max: 0.3 }, lightSource: null },
    },
    sources: [
      { label: "Sonic Mini 8K S product page", url: "https://phrozen3d.com/en/products/sonic-mini-8k-s" },
      { label: "Sonic Mini 8K S Z-axis calibration", url: "https://helpcenter.phrozen3d.com/hc/en-us/articles/18859239372057--Sonic-Mini-8K-S-Z-axis-Calibration" },
    ],
    sourceId: "phrozen-site",
  }),
];
