import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { setParams } from "@/test/next-navigation";
import { seed } from "@/content";
import { GuideRunner } from "./guide-runner";

const guide = seed.guides.find((g) => g.slug === "level-the-bed")!;

function renderGuide() {
  return render(
    <GuideRunner
      guide={guide}
      printers={seed.printers}
      printerNames={Object.fromEntries(seed.printers.map((p) => [p.slug, p.name]))}
      safetyNotices={seed.safetyNotices}
      flowTitles={Object.fromEntries(seed.flows.map((f) => [f.id, f.title]))}
      guideTitles={Object.fromEntries(seed.guides.map((g) => [g.slug, g.title]))}
    />,
  );
}

describe("GuideRunner", () => {
  beforeEach(() => setParams(""));

  it("shows every hardware variant, labelled, when the printer is unknown", async () => {
    renderGuide();
    expect((await screen.findAllByText(/manual beds only/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/printers with a separate probe only/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent(`0 of ${guide.steps.length} steps done`);
  });

  it("shows only the steps for the printer's levelling system", async () => {
    setParams("printer=creality-ender-3-v2");
    renderGuide();
    expect(await screen.findByRole("heading", { name: /set each corner with a sheet of paper/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /measure a fresh bed mesh/i })).not.toBeInTheDocument();
  });

  it("lets the user override the printer's hardware, for example after fitting a probe", async () => {
    setParams("printer=creality-ender-3-v2");
    renderGuide();
    await userEvent.click(await screen.findByRole("button", { name: /a separate probe beside the nozzle/i }));
    expect(screen.getByRole("heading", { name: /measure a fresh bed mesh/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /set each corner/i })).not.toBeInTheDocument();
  });

  it("ticks off steps, keeps them visible, and resumes progress", async () => {
    setParams("printer=creality-ender-3-v2");
    const { unmount } = renderGuide();
    await userEvent.click(await screen.findByRole("button", { name: /mark step 1 as done/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/^1 of/);
    expect(screen.getByRole("heading", { name: /clean the nozzle and the bed/i })).toBeInTheDocument();
    unmount();
    renderGuide();
    expect(await screen.findByText(/your progress was saved/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/^1 of/);
  });

  it("records a fix", async () => {
    renderGuide();
    await userEvent.click(await screen.findByRole("button", { name: /this fixed it/i }));
    expect(screen.getByText(/glad it is fixed/i)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("fmp:history")!)[0]).toMatchObject({ guideSlug: "level-the-bed", result: "fixed" });
  });

  it("routes 'still not fixed' back to the diagnosis with the cause marked as tried", async () => {
    setParams("from=first-layer-adhesion&outcome=nozzle-too-far&printer=prusa-mk4");
    renderGuide();
    await userEvent.click(await screen.findByRole("button", { name: /still not fixed/i }));
    expect(screen.getByRole("link", { name: /back to the diagnosis: show the next cause/i })).toHaveAttribute(
      "href",
      "/diagnose/first-layer-adhesion?tried=nozzle-too-far&printer=prusa-mk4",
    );
  });

  it("offers the guide's follow-up diagnosis when not reached from one", async () => {
    renderGuide();
    await userEvent.click(await screen.findByRole("button", { name: /still not fixed/i }));
    expect(screen.getByRole("link", { name: /diagnose: bed levelling and probe problems/i })).toHaveAttribute("href", "/diagnose/bed-levelling-and-probe");
  });
});
