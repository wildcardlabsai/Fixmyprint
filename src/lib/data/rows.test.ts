import { describe, expect, it } from "vitest";
import { parseContent, seed, type SeedContent } from "@/content";
import { contentToRows, rowsToContent, TABLE_ORDER } from "./rows";

/** Sorts unordered collections so the comparison ignores database row order. */
function normalise(c: SeedContent) {
  const bySlug = <T extends { slug: string }>(xs: T[]) => [...xs].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    ...c,
    sources: [...c.sources].sort((a, b) => a.id.localeCompare(b.id)),
    safetyNotices: [...c.safetyNotices].sort((a, b) => a.id.localeCompare(b.id)),
    manufacturers: bySlug(c.manufacturers),
    printers: bySlug(c.printers),
    guides: bySlug(c.guides),
    filaments: bySlug(c.filaments),
    maintenance: bySlug(c.maintenance),
    parts: bySlug(c.parts),
    errorCodes: bySlug(c.errorCodes),
  };
}

describe("database row mapping", () => {
  const rows = contentToRows(seed);

  it("produces rows for every table", () => {
    for (const t of TABLE_ORDER) expect(rows[t], t).toBeDefined();
    expect(rows.diagnostic_questions.length).toBe(seed.flows.reduce((n, f) => n + f.questions.length, 0));
  });

  it("round-trips all seed content through the relational shape", () => {
    const back = parseContent(rowsToContent(rows), seed.version);
    expect(normalise(back)).toEqual(normalise(seed));
  });

  it("uses only the latest non-draft version of a flow", () => {
    const withDraft = structuredClone(rows);
    const flow = withDraft.diagnostic_flows[0]!;
    withDraft.diagnostic_flows.push({ ...flow, version: 99, review_status: "draft", title: "Draft" });
    const back = parseContent(rowsToContent(withDraft), seed.version);
    expect(back.flows.find((f) => f.id === flow.key)?.title).not.toBe("Draft");
  });

  it("never stores a zero-weight evidence row", () => {
    expect(rows.diagnostic_option_evidence.every((e) => e.weight !== 0)).toBe(true);
  });
});
