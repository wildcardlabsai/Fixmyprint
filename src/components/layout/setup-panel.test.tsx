import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { seed } from "@/content";
import { keys } from "@/lib/client/storage";
import { manufacturerOptions, printerOptions, slicerChoicesByPrinter, slicerOptions } from "@/lib/data/view-models";
import { SetupButton, SetupPanel } from "./setup-panel";

const data = { printers: printerOptions(seed), manufacturers: manufacturerOptions(seed), slicers: slicerOptions(seed), slicerChoices: slicerChoicesByPrinter(seed) };

describe("My setup", () => {
  beforeEach(() => window.localStorage.clear());

  it("saves a printer and defaults the slicer to its maker's own", async () => {
    render(
      <>
        <SetupButton data={data} open onToggle={() => {}} />
        <SetupPanel data={data} onDone={() => {}} />
      </>,
    );
    await userEvent.type(screen.getByLabelText("Search by manufacturer or model"), "a1 mini");
    await userEvent.click(screen.getByRole("button", { name: /^Bambu Lab A1 mini/ }));
    expect(window.localStorage.getItem(keys.printer)).toBe("bambu-lab-a1-mini");
    expect(screen.getByLabelText("Your slicer")).toHaveValue("bambu-studio");
    expect(screen.getByRole("button", { name: /A1 mini · Bambu Studio/ })).toBeInTheDocument();
  });

  it("keeps a chosen slicer and clears everything on request", async () => {
    window.localStorage.setItem(keys.printer, "prusa-mk4");
    render(<SetupPanel data={data} onDone={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText("Your slicer"), "orcaslicer");
    expect(window.localStorage.getItem(keys.slicer)).toBe("orcaslicer");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(window.localStorage.getItem(keys.printer)).toBeNull();
    expect(window.localStorage.getItem(keys.slicer)).toBeNull();
  });
});
