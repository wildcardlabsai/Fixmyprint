import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { slicerSettingKeySchema } from "@/lib/schema";
import { ancestry, findSlicer, printersForSlicer, resolveSetting, slicersForPrinter } from "./slicers";

const printer = (slug: string) => seed.printers.find((p) => p.slug === slug)!;
const slicer = (slug: string) => findSlicer(seed, slug)!;
const namesFor = (slug: string) => slicersForPrinter(seed, printer(slug)).map((x) => x.slicer.slug);

describe("slicers for a printer", () => {
  it("lists the manufacturer's own slicer first", () => {
    expect(namesFor("bambu-lab-x1-carbon")).toEqual(["bambu-studio"]);
    expect(namesFor("prusa-mk4")[0]).toBe("prusaslicer");
    expect(namesFor("flashforge-adventurer-5m")).toEqual(["flash-studio-desktop", "flashprint"]);
    expect(namesFor("anycubic-kobra-3")[0]).toBe("anycubic-slicer-next");
    expect(namesFor("qidi-plus4")).toEqual(["qidi-studio", "orcaslicer"]);
  });

  it("only links models the manufacturer names", () => {
    expect(namesFor("flashforge-ad5x")).toEqual(["flash-studio-desktop"]);
    expect(namesFor("anycubic-kobra-2-neo")).toEqual([]);
    expect(namesFor("elegoo-neptune-4-pro")).toEqual([]);
    expect(namesFor("sovol-sv08")).toEqual(["orcaslicer"]);
  });

  it("gives every printer link a manufacturer source", () => {
    for (const s of seed.slicers) {
      for (const { link } of printersForSlicer(seed, s)) expect(link.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("covers every Bambu Lab, Prusa, Creality, QIDI, Raise3D and UltiMaker printer", () => {
    for (const p of seed.printers.filter((x) => ["bambu-lab", "prusa-research", "creality", "qidi-tech", "raise3d", "ultimaker"].includes(x.manufacturer))) {
      expect(slicersForPrinter(seed, p).length, p.slug).toBeGreaterThan(0);
    }
  });
});

describe("setting names", () => {
  it("uses the slicer's own documented name", () => {
    expect(resolveSetting(seed, slicer("ultimaker-cura"), "avoid-crossing")?.setting.name).toBe("Combing Mode");
    expect(resolveSetting(seed, slicer("prusaslicer"), "flow")?.setting.name).toBe("Extrusion multiplier");
    expect(resolveSetting(seed, slicer("orcaslicer"), "flow")).toMatchObject({ inherited: false, setting: { name: "Flow ratio" } });
  });

  it("marks names taken from the parent project as inherited", () => {
    const r = resolveSetting(seed, slicer("anycubic-slicer-next"), "retraction");
    expect(r?.inherited).toBe(true);
    expect(r?.documentedBy.slug).toBe("orcaslicer");
  });

  it("returns nothing rather than guessing for slicers without documentation or a parent", () => {
    expect(slicerSettingKeySchema.options.map((k) => resolveSetting(seed, slicer("creality-print"), k))).toEqual(slicerSettingKeySchema.options.map(() => null));
    expect(resolveSetting(seed, slicer("ultimaker-cura"), "pressure-advance")).toBeNull();
  });

  it("traces lineage back to PrusaSlicer", () => {
    expect(ancestry(seed, slicer("elegooslicer")).map((s) => s.slug)).toEqual(["orcaslicer", "bambu-studio", "prusaslicer"]);
  });
});
