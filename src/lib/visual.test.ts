import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { seed } from "@/content";
import { applicableChecks, factsFromPrinter } from "@/lib/engine/conditions";
import { applyAnswers, evaluate } from "@/lib/engine/engine";
import { guidesForPrinter } from "@/lib/data/selectors";
import { assetMap, isVisual, pickImage, symptomForAnswers, symptomHref, symptomsForType } from "./visual";

const assets = assetMap(seed.visualAssets);
const symptom = (slug: string) => seed.symptoms.find((s) => s.slug === slug)!;
const flow = (id: string) => seed.flows.find((f) => f.id === id)!;
const printer = (slug: string) => seed.printers.find((p) => p.slug === slug)!;

describe("visual symptom catalogue", () => {
  it("has the requested FDM and resin symptoms, each with a picture", () => {
    const fdm = symptomsForType(seed.symptoms, "fdm").filter(isVisual);
    const resin = symptomsForType(seed.symptoms, "msla").filter(isVisual);
    expect(fdm.length).toBeGreaterThanOrEqual(24);
    expect(resin.map((s) => s.slug).sort()).toEqual(
      ["resin-cracked-print", "resin-distorted-details", "resin-film-problems", "resin-layer-separation", "resin-not-curing", "resin-not-sticking", "resin-partial-print", "resin-supports-failing", "resin-surface-defects"].sort(),
    );
    for (const s of [...fdm, ...resin]) expect(pickImage(assets, s.images), s.slug).not.toBeNull();
  });

  it("never shows filament problems to resin printers or the reverse", () => {
    expect(symptomsForType(seed.symptoms, "msla").every((s) => s.printerTypes.includes("msla"))).toBe(true);
    expect(symptomsForType(seed.symptoms, "fdm").some((s) => s.slug.startsWith("resin-"))).toBe(false);
  });

  it("gives every symptom its own image, never another defect's", () => {
    const owners = new Map<string, string>();
    for (const s of seed.symptoms) {
      for (const id of s.images) {
        expect(owners.get(id) ?? s.slug, `${id} is used by two symptoms`).toBe(s.slug);
        owners.set(id, s.slug);
        expect(assets[id]?.subject).toBe(`symptom:${s.slug}`);
      }
    }
  });

  it("keeps a truthful manifest: available files exist, photos are licensed, missing ones have no file", () => {
    for (const a of seed.visualAssets) {
      if (a.status === "available") expect(existsSync(path.join(process.cwd(), "public", a.file!)), a.file!).toBe(true);
      else expect(a.file).toBeNull();
      if (a.kind === "photo" && a.status === "available") expect([a.creator, a.licence, a.sourceUrl].every(Boolean)).toBe(true);
    }
  });
});

describe("image fallbacks", () => {
  it("skips a missing photograph and uses the illustration", () => {
    const s = symptom("stringing");
    expect(assets[s.images[0]!]?.status).toBe("missing");
    expect(pickImage(assets, s.images)?.kind).toBe("illustration");
  });

  it("returns nothing rather than an unrelated image when none is available", () => {
    expect(pickImage(assets, ["photo-stringing"])).toBeNull();
    expect(pickImage(assets, ["does-not-exist"])).toBeNull();
  });
});

describe("choosing a symptom", () => {
  it("links to its diagnosis with the answers filled in", () => {
    expect(symptomHref(symptom("stringing"), "prusa-mk4")).toBe("/diagnose/stringing-and-surface?symptom=stringing&printer=prusa-mk4");
  });

  it("starts every symptom's diagnosis past the questions its picture already answers", () => {
    for (const s of seed.symptoms) {
      if (!s.flowId || Object.keys(s.preset).length === 0) continue;
      const f = flow(s.flowId);
      const ev = evaluate(f, applyAnswers(f, s.preset));
      for (const q of Object.keys(s.preset)) expect(ev.steps.some((st) => st.question.id === q), `${s.slug} ${q}`).toBe(true);
      expect(ev.current && Object.keys(s.preset).includes(ev.current.id), s.slug).toBeFalsy();
    }
  });

  it("asks different follow-up questions for different symptoms", () => {
    const f = flow("stringing-and-surface");
    const next = (slug: string) => evaluate(f, applyAnswers(f, symptom(slug).preset)).current?.id;
    expect(next("stringing")).toBe("popping");
    expect(next("blobs-and-zits")).toBe("zit-where");
    const w = flow("warping-and-dimensions");
    expect(evaluate(w, applyAnswers(w, symptom("warping").preset)).current?.id).toBe("lift-look");
    expect(evaluate(w, applyAnswers(w, symptom("wrong-dimensions").preset)).current?.id).toBe("size-pattern");
  });

  it("recognises the symptom from the answers, preferring the most specific", () => {
    const f = flow("first-layer-adhesion");
    expect(symptomForAnswers(seed.symptoms, f.id, { "what-happens": "thin" })?.slug).toBe("first-layer-too-squashed");
    expect(symptomForAnswers(seed.symptoms, f.id, { "what-happens": "thin", "thin-detail": "scraping" })?.slug).toBe("nozzle-scraping");
    expect(symptomForAnswers(seed.symptoms, f.id, { "what-happens": "other" })).toBeNull();
  });

  it("shows picture options in follow-up questions", () => {
    const w = flow("warping-and-dimensions");
    const q = w.questions.find((x) => x.id === "lift-look")!;
    expect(q.options.every((o) => o.image && pickImage(assets, [o.image]))).toBe(true);
  });
});

describe("printer-specific rules for resin printers", () => {
  const plateCheck = (slug: string) => {
    const outcome = flow("resin-build-and-supports").outcomes.find((o) => o.id === "plate-level")!;
    return applicableChecks(outcome.checks, factsFromPrinter(printer(slug))).join(" ");
  };

  it("never tells a self-levelling resin printer to level by hand", () => {
    expect(plateCheck("elegoo-saturn-4-ultra-16k")).not.toMatch(/sheet of paper/);
    expect(plateCheck("elegoo-saturn-4-ultra-16k")).toMatch(/automatic levelling or zeroing/);
    expect(plateCheck("phrozen-sonic-mini-8k-s")).toMatch(/sheet of paper/);
  });

  it("lists only guides for the printer's technology", () => {
    const resin = guidesForPrinter(seed, "anycubic-photon-mono-m7-pro").general;
    expect(resin.length).toBeGreaterThan(0);
    expect(resin.every((g) => g.printerTypes.includes("msla"))).toBe(true);
    expect(guidesForPrinter(seed, "prusa-mk4").general.some((g) => g.printerTypes.includes("msla"))).toBe(false);
  });

  it("keeps resin flows for resin printers only", () => {
    for (const f of seed.flows) {
      const resinOnly = f.id.startsWith("resin-");
      expect(f.printerTypes, f.id).toEqual(resinOnly ? ["msla"] : ["fdm"]);
    }
  });
});
