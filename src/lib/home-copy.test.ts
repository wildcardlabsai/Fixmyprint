import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { benefits, heroEyebrow } from "./home-copy";

describe("homepage claims", () => {
  it("only claims what the content covers", () => {
    const brands = seed.manufacturers.filter((m) => seed.printers.some((p) => p.manufacturer === m.slug)).length;
    expect(heroEyebrow(seed)).toBe(`FDM PRINTER SUPPORT · ${brands} MAJOR BRANDS`);
    const text = JSON.stringify(benefits(seed));
    expect(text).not.toMatch(/MSLA|resin printers\.$|photograph|all major/i);
    expect(benefits(seed)).toHaveLength(5);
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
