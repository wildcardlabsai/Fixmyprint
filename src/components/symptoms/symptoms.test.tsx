import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { setParams } from "@/test/next-navigation";
import { seed } from "@/content";
import { DiagnoseStart } from "@/components/diagnose/diagnose-start";
import { manufacturerOptions, printerOptions } from "@/lib/data/view-models";
import { assetMap, isVisual, symptomsForType } from "@/lib/visual";
import { PhotoUpload } from "./photo-upload";
import { SymptomGrid } from "./symptom-grid";
import { SymptomImage } from "./symptom-image";

const assets = assetMap(seed.visualAssets);
const fdm = symptomsForType(seed.symptoms, "fdm");

const renderGrid = () =>
  render(
    <SymptomGrid
      symptoms={fdm.filter(isVisual)}
      otherProblems={fdm.filter((s) => !isVisual(s))}
      categories={seed.categories}
      assets={assets}
      printerType="fdm"
      printerSlug="prusa-mk4"
    />,
  );

describe("SymptomGrid", () => {
  it("shows a picture card for each visual problem, labelled for screen readers", () => {
    renderGrid();
    const card = screen.getByRole("radio", { name: /Stringing and fine hairs between parts/ });
    expect(card).toHaveAccessibleDescription(/Fine hairs or strands/);
    expect(screen.getByRole("img", { name: /Illustration\. Stringing/ })).toBeInTheDocument();
  });

  it("marks the chosen card and continues to its diagnosis with the answer filled in", async () => {
    renderGrid();
    await userEvent.click(screen.getByRole("radio", { name: /Stringing and fine hairs/ }));
    expect(screen.getByRole("radio", { name: /Stringing and fine hairs/ })).toBeChecked();
    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/diagnose/stringing-and-surface?symptom=stringing&printer=prusa-mk4");
  });

  it("offers a way forward without picking a picture", async () => {
    renderGrid();
    await userEvent.click(screen.getByRole("radio", { name: /I'm not sure/ }));
    expect(screen.getByRole("link", { name: /First layer and bed adhesion/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /Something else/ }));
    expect(screen.getByRole("link", { name: /Cannot connect to Wi-Fi/ })).toBeInTheDocument();
  });

  it("filters by area", async () => {
    renderGrid();
    await userEvent.click(screen.getByRole("button", { name: "Motion, belts and unusual noises" }));
    expect(screen.getByRole("radio", { name: /Layer shifting/ })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Stringing and fine hairs/ })).not.toBeInTheDocument();
  });
});

describe("SymptomImage", () => {
  it("says there is no image instead of showing something unrelated", () => {
    render(<SymptomImage asset={null} />);
    expect(screen.getByText("No image yet")).toBeInTheDocument();
  });

  it("falls back when the image fails to load", () => {
    render(<SymptomImage asset={assets["ill-stringing"]!} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("Image could not be loaded")).toBeInTheDocument();
  });
});

describe("PhotoUpload", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("is optional, explains it is not analysed, and rejects files that are not images", async () => {
    render(<PhotoUpload />);
    expect(screen.getByText(/does not analyse photos/)).toBeInTheDocument();
    const input = screen.getByLabelText("Photo of your print", { selector: "input" });
    await userEvent.upload(input, new File(["hello"], "notes.txt", { type: "text/plain" }), { applyAccept: false });
    expect(await screen.findByText(/not an image/)).toBeInTheDocument();
  });

  it("shows a kept photo with replace and remove", async () => {
    window.sessionStorage.setItem("fmp:photo", JSON.stringify({ dataUrl: "data:image/jpeg;base64,AAAA", name: "print.jpg", at: 1 }));
    render(<PhotoUpload />);
    expect(screen.getByRole("img", { name: "Your photo of the print" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByRole("img", { name: "Your photo of the print" })).not.toBeInTheDocument();
  });
});

describe("DiagnoseStart", () => {
  beforeEach(() => {
    setParams("");
    window.localStorage.clear();
  });

  const renderStart = () =>
    render(
      <DiagnoseStart
        categories={seed.categories}
        symptoms={seed.symptoms}
        assets={assets}
        flows={seed.flows.map((f) => ({ id: f.id, title: f.title }))}
        errorCodes={[]}
        printers={printerOptions(seed)}
        manufacturers={manufacturerOptions(seed)}
      />,
    );

  it("switches between filament and resin problems", async () => {
    renderStart();
    expect(screen.getByRole("radio", { name: /Corners lifting or warping/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Resin printer (MSLA)" }));
    expect(screen.getByRole("radio", { name: /Prints failing to stick to the build plate/ })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Corners lifting or warping/ })).not.toBeInTheDocument();
  });

  it("uses the printer's own technology when a printer is chosen", () => {
    setParams("printer=elegoo-mars-5-ultra");
    renderStart();
    expect(screen.queryByRole("button", { name: "Resin printer (MSLA)" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Resin not curing correctly/ })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Stringing and fine hairs/ })).not.toBeInTheDocument();
  });
});
