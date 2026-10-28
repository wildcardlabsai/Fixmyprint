import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { checkFilamentCompatibility, overall } from "./filament-compat";

const f = (slug: string) => seed.filaments.find((x) => x.slug === slug)!;
const p = (slug: string) => seed.printers.find((x) => x.slug === slug)!;

describe("filament compatibility", () => {
  it("accepts PLA on a common printer", () => {
    expect(overall(checkFilamentCompatibility(f("pla"), p("bambu-lab-p1s")))).toBe("ok");
  });

  it("blocks PC where the bed or hotend cannot reach its temperatures, or the frame is open", () => {
    expect(checkFilamentCompatibility(f("pc"), p("anycubic-kobra-2-max")).find((n) => n.topic === "Bed temperature")?.level).toBe("blocker");
    expect(checkFilamentCompatibility(f("pc"), p("bambu-lab-a1")).find((n) => n.topic === "Enclosure")?.level).toBe("blocker");
    const coolHotend = { ...p("prusa-mini-plus"), specs: { ...p("prusa-mini-plus").specs, hotendMaxTempC: 250 } };
    expect(checkFilamentCompatibility(f("pc"), coolHotend).find((n) => n.topic === "Nozzle temperature")?.level).toBe("blocker");
  });

  it("flags the A1 mini's bed for ABS", () => {
    expect(checkFilamentCompatibility(f("abs"), p("bambu-lab-a1-mini")).find((n) => n.topic === "Bed temperature")?.level).toBe("blocker");
  });

  it("reports unknown rather than guessing when specifications are missing", () => {
    const notes = checkFilamentCompatibility(f("abs"), p("creality-ender-3-v2"));
    expect(notes.find((n) => n.topic === "Nozzle temperature")?.level).toBe("unknown");
    expect(notes.find((n) => n.topic === "Bed temperature")?.level).toBe("unknown");
  });

  it("cautions about abrasive filament and Bowden extruders with flexible filament", () => {
    expect(checkFilamentCompatibility(f("fibre-reinforced"), p("prusa-mk4")).some((n) => n.topic === "Nozzle" && n.level === "caution")).toBe(true);
    expect(checkFilamentCompatibility(f("tpu"), p("prusa-mini-plus")).find((n) => n.topic === "Extruder")?.level).toBe("caution");
  });
});
