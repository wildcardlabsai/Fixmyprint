import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { setParams } from "@/test/next-navigation";
import { seed } from "@/content";
import { keys } from "@/lib/client/storage";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";
import { DiagnosticRunner } from "./diagnostic-runner";

const flow = seed.flows.find((f) => f.id === "first-layer-adhesion")!;

function renderRunner() {
  return render(
    <DiagnosticRunner
      flow={flow}
      printers={seed.printers}
      printerOptions={printerOptions(seed)}
      manufacturerOptions={manufacturerOptions(seed)}
      guides={seed.guides.map((g) => ({ slug: g.slug, title: g.title, summary: g.summary }))}
      safetyNotices={seed.safetyNotices}
    />,
  );
}

const answer = async (label: RegExp) => userEvent.click(await screen.findByRole("button", { name: label }));

describe("DiagnosticRunner", () => {
  beforeEach(() => setParams(""));

  it("asks the first question and branches on the answer", async () => {
    renderRunner();
    expect(await screen.findByRole("heading", { name: /what happens when the first layer is printed/i })).toBeInTheDocument();
    await answer(/some areas stick while others do not/i);
    expect(await screen.findByRole("heading", { name: /where does it stick/i })).toBeInTheDocument();
  });

  it("reaches a ranked result with reasons, checks and a repair guide link", async () => {
    renderRunner();
    await answer(/never sticks and is dragged around/i);
    await answer(/round, like a piece of string/i);
    await answer(/knobs or screws under the bed/i);
    await answer(/recently, with dish soap/i);
    await answer(/^PLA$/);
    await answer(/yes, within the range/i);

    expect(await screen.findByRole("heading", { name: /nozzle is too far from the bed/i })).toBeInTheDocument();
    expect(screen.getByText("Strong match")).toBeInTheDocument();
    expect(screen.getByText(/you answered “round, like a piece of string/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start repair guide/i })).toHaveAttribute("href", expect.stringContaining("/guides/level-the-bed?from=first-layer-adhesion&outcome=nozzle-too-far"));
    // Manual levelling selected: probe-only checks are hidden.
    expect(screen.queryByText(/separate probe: lower the z offset/i)).not.toBeInTheDocument();
  });

  it("goes back and lets an earlier answer be changed", async () => {
    renderRunner();
    await answer(/never sticks and is dragged around/i);
    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(await screen.findByRole("heading", { name: /what happens when the first layer/i })).toBeInTheDocument();

    await answer(/never sticks and is dragged around/i);
    await answer(/round, like a piece of string/i);
    const summary = screen.getByRole("complementary");
    await userEvent.click(within(summary).getByRole("button", { name: /change answer to “what happens/i }));
    expect(screen.getByText(/changing an earlier answer/i)).toBeInTheDocument();
    await answer(/the lines look very thin/i);
    expect(await screen.findByRole("heading", { name: /what else do you notice/i })).toBeInTheDocument();
    expect(within(summary).queryByText(/round, like a piece of string/i)).not.toBeInTheDocument();
  });

  it("fills in answers from the selected printer and shows where they came from", async () => {
    setParams("printer=prusa-mk4");
    renderRunner();
    await answer(/never sticks and is dragged around/i);
    await answer(/round, like a piece of string/i);
    // The levelling question is skipped for the MK4.
    expect(await screen.findByRole("heading", { name: /when did you last clean/i })).toBeInTheDocument();
    expect(screen.getByText(/from your printer's specifications/i)).toBeInTheDocument();
  });

  it("moves to the next cause when the first did not fix it, and can undo that", async () => {
    renderRunner();
    await answer(/never sticks and is dragged around/i);
    await answer(/flattened slightly/i);
    await answer(/knobs or screws/i);
    await answer(/a dry wipe/i);
    await answer(/^PLA$/);
    await answer(/lower than that/i);
    const first = (await screen.findAllByRole("heading", { level: 2 }))[0]!.textContent;
    await userEvent.click(screen.getByRole("button", { name: /still not fixed/i }));
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings[0]!.textContent).not.toBe(first);
    expect(screen.getByRole("heading", { name: /already tried/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect((await screen.findAllByRole("heading", { level: 2 }))[0]!.textContent).toBe(first);
  });

  it("applies a 'still not fixed' hand-back from a repair guide", async () => {
    window.localStorage.setItem(
      keys.session(flow.id),
      JSON.stringify({ flowVersion: flow.version, printerSlug: null, answers: { "what-happens": "inconsistent", "extrude-test": "nothing" }, tried: [], updatedAt: Date.now() }),
    );
    setParams("tried=extrusion-problem");
    renderRunner();
    expect(await screen.findByRole("heading", { name: /tried every likely cause/i })).toBeInTheDocument();
  });

  it("saves progress on this device and resumes it", async () => {
    const { unmount } = renderRunner();
    await answer(/some areas stick while others do not/i);
    unmount();
    renderRunner();
    expect(await screen.findByRole("heading", { name: /where does it stick/i })).toBeInTheDocument();
    expect(screen.getByText(/picked up where you left off/i)).toBeInTheDocument();
  });

  it("ignores a saved session from an older version of the flow", async () => {
    window.localStorage.setItem(keys.session(flow.id), JSON.stringify({ flowVersion: flow.version + 1, printerSlug: null, answers: { "what-happens": "patchy" }, tried: [], updatedAt: 1 }));
    renderRunner();
    expect(await screen.findByRole("heading", { name: /what happens when the first layer/i })).toBeInTheDocument();
  });

  it("shows safety notices before a hot-nozzle check", async () => {
    renderRunner();
    await answer(/does not seem to extrude consistently/i);
    expect(await screen.findByRole("heading", { name: /heat the nozzle/i })).toBeInTheDocument();
    expect(screen.getAllByText(/hot surfaces/i).length).toBeGreaterThan(0);
  });
});
