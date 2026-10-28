import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { specRows, withDetail } from "./printer-labels";

describe("specification labels", () => {
  it("does not repeat a detail that only restates the label", () => {
    expect(withDetail("Bambu Lab firmware", "Bambu Lab firmware")).toBe("Bambu Lab firmware");
    expect(withDetail("Klipper-based", "Klipper")).toBe("Klipper-based");
    expect(withDetail("Direct drive", "Direct drive extruder with dual gears")).toBe("Direct drive extruder with dual gears");
    expect(withDetail("Marlin-based", "Creality build")).toBe("Marlin-based. Creality build");
  });

  it("never shows the same sentence twice in any printer's table", () => {
    for (const p of seed.printers) {
      for (const r of specRows(p, (s) => s)) {
        const parts = (r.value ?? "").split(". ").map((x) => x.toLowerCase());
        expect(new Set(parts).size, `${p.slug} ${r.label}`).toBe(parts.length);
      }
    }
  });
});
