import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { setParams } from "@/test/next-navigation";
import { seed } from "@/content";
import { keys } from "@/lib/client/storage";
import { SlicerSettingsPanel } from "./slicer-settings-panel";

const renderPanel = (printerSlug: string | null) =>
  render(<SlicerSettingsPanel settingKeys={["flow", "retraction"]} slicers={seed.slicers} printers={seed.printers} printerSlug={printerSlug} />);

describe("SlicerSettingsPanel", () => {
  beforeEach(() => {
    setParams("");
    window.localStorage.clear();
  });

  it("defaults to the printer manufacturer's slicer", () => {
    renderPanel("prusa-mk4");
    expect(screen.getByLabelText("Slicer")).toHaveValue("prusaslicer");
    expect(screen.getByText("Extrusion multiplier")).toBeInTheDocument();
    expect(screen.getByText("Printer Settings › Extruder 1 › Retraction")).toBeInTheDocument();
  });

  it("asks for a slicer when the printer is unknown, and remembers the choice", async () => {
    renderPanel(null);
    expect(screen.getByText(/Choose your slicer to see/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Slicer"), "ultimaker-cura");
    expect(screen.getByText("Retraction Distance")).toBeInTheDocument();
    expect(window.localStorage.getItem(keys.slicer)).toBe("ultimaker-cura");
  });

  it("says when a setting is not documented, and flags inherited names", async () => {
    renderPanel("bambu-lab-a1");
    expect(screen.getByText("Flow ratio")).toBeInTheDocument();
    // Bambu Studio does not document retraction; the PrusaSlicer name is shown and flagged.
    expect(screen.getByText(/Bambu Lab doesn.t publish names for some of these/)).toHaveTextContent("come from PrusaSlicer");
    expect(screen.getAllByText("not confirmed", { selector: "span.rounded" })).toHaveLength(1);
    await userEvent.selectOptions(screen.getByLabelText("Slicer"), "creality-print");
    expect(screen.getAllByText(/Not documented by Creality/)).toHaveLength(2);
  });

  it("shows a guide's general values beside the slicer's name for the same setting", () => {
    render(
      <SlicerSettingsPanel
        settingKeys={[]}
        values={[{ name: "Retraction distance (Bowden)", key: "retraction", value: "4–7 mm" }, { name: "Fan", value: "Off" }]}
        slicers={seed.slicers}
        printers={seed.printers}
        printerSlug="prusa-mini-plus"
      />,
    );
    expect(screen.getByText("Retraction length")).toBeInTheDocument();
    expect(screen.getByText("4–7 mm")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });
});
