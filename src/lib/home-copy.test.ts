import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { benefits, heroEyebrow } from "./home-copy";

describe("homepage claims", () => {
  it("only claims what the content covers", () => {
    const brands = seed.manufacturers.filter((m) => seed.printers.some((p) => p.manufacturer === m.slug)).length;
    // Resin printers are in the library, so both technologies are claimed; "all brands" never is.
    expect(heroEyebrow(seed)).toBe(`FDM & MSLA RESIN SUPPORT · ${brands} MAJOR BRANDS`);
    const text = JSON.stringify(benefits(seed));
    expect(text).not.toMatch(/all major/i);
    // No licensed photographs yet, so none are claimed.
    expect(seed.visualAssets.some((a) => a.kind === "photo" && a.status === "available")).toBe(false);
    expect(text).not.toMatch(/photograph/i);
    expect(benefits(seed)).toHaveLength(5);
  });

  it("only claims photographs once a licensed one is available", () => {
    const photo = { ...seed.visualAssets.find((a) => a.kind === "photo")!, status: "available" as const };
    const c = { ...seed, visualAssets: [...seed.visualAssets, photo] };
    expect(benefits(c).find((b) => b.icon === "visual")?.text).toBe("Compare symptoms with relevant photographs and diagrams.");
  });

  it("uses the full wording once resin printers and illustrated guides exist", () => {
    const resin = { ...seed.printers[0]!, slug: "resin-test", specs: { ...seed.printers[0]!.specs, printerType: "msla" } } as unknown as (typeof seed.printers)[number];
    const guides = seed.guides.map((g) => ({ ...g, steps: g.steps.map((s, i) => (i === 0 ? { ...s, diagram: "first-layer-height" as const } : s)) }));
    const c = { ...seed, printers: [...seed.printers, resin], guides };
    expect(heroEyebrow(c)).toMatch(/^FDM & MSLA RESIN SUPPORT · /);
    expect(benefits(c).map((b) => b.title)).toContain("FDM & MSLA support");
    expect(benefits(c).find((b) => b.icon === "steps")?.text).toBe("Follow practical, illustrated repair instructions.");
  });
});
