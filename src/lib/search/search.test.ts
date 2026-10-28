import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { buildIndex, compact, editDistance, search, tokens } from "./search";

const index = buildIndex(seed);
const top = (q: string) => search(index, q)[0]?.doc;
const ids = (q: string) => search(index, q).map((r) => r.doc.id);

describe("search normalisation", () => {
  it("compacts model names", () => {
    expect(compact("Ender-3 V2")).toBe("ender3v2");
    expect(compact("MK3S+")).toBe("mk3splus");
  });

  it("maps spelling variants and drops filler words", () => {
    expect(tokens("my bed leveling")).toEqual(["bed", "levelling"]);
    expect(tokens("Color")).toEqual(["colour"]);
  });

  it("measures edit distance with transpositions", () => {
    expect(editDistance("stringing", "strnigning", 2)).toBeLessThanOrEqual(2);
    expect(editDistance("nozzle", "nozle")).toBe(1);
    expect(editDistance("pla", "petg", 1)).toBeGreaterThan(1);
  });
});

describe("search matching", () => {
  it("finds printers however the model is typed", () => {
    for (const q of ["Ender-3 V2", "ender 3 v2", "ender3v2", "e3v2", "Creality Ender 3 V2"]) {
      expect(top(q)?.id, q).toBe("creality-ender-3-v2");
    }
  });

  it("matches model aliases and partial names", () => {
    expect(top("mk3s+")?.id).toBe("prusa-mk3s-plus");
    expect(top("a1 mini")?.id).toBe("bambu-lab-a1-mini");
    expect(ids("bambu")).toEqual(expect.arrayContaining(["bambu-lab-p1s", "bambu-lab-a1-mini"]));
  });

  it("finds symptoms by everyday words and synonyms", () => {
    expect(top("stringing")?.type).toBe("symptom");
    expect(ids("oozing")).toContain("stringing");
    expect(ids("clogged nozzle")).toContain("not-extruding");
    expect(ids("corners lifting")).toContain("warping");
  });

  it("tolerates small typos", () => {
    expect(ids("strining")).toContain("stringing");
    expect(ids("nozel clog")).toContain("not-extruding");
  });

  it("handles UK and US spellings", () => {
    expect(ids("bed leveling failed")).toContain("probing-failed");
    expect(ids("bed levelling failed")).toContain("probing-failed");
  });

  it("finds error messages", () => {
    expect(top("thermal runaway")?.id).toBe("marlin-thermal-runaway");
    expect(ids("thermal runaway")).toContain("thermal-runaway");
    expect(ids("thermal runaway")).toContain("marlin-thermal-runaway");
    expect(top("MINTEMP")?.id).toBe("marlin-mintemp");
    expect(ids("timer too close")).toContain("klipper-timer-too-close");
  });

  it("finds filament and guides", () => {
    expect(top("PETG")?.id).toBe("petg");
    expect(ids("carbon fiber")).toContain("fibre-reinforced");
    expect(ids("cold pull")).toContain("clear-a-blocked-nozzle");
  });

  it("returns nothing for empty, tiny or unrelated queries", () => {
    expect(search(index, "")).toEqual([]);
    expect(search(index, "x")).toEqual([]);
    expect(search(index, "qwertyuiop zxcv")).toEqual([]);
  });

  it("requires every word to match", () => {
    expect(ids("ender bambu")).toEqual([]);
  });
});
