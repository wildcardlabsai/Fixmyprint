import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("starts a diagnosis from a selected printer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Let's get your printer working again.");
    const finder = page.locator("#find-printer");
    await finder.getByLabel("Search by manufacturer or model").fill("ender3 v2");
    await finder.getByRole("button", { name: /^Creality Ender-3 V2 Bed-slinger/ }).click();
    await finder.getByRole("link", { name: "Diagnose a problem" }).click();
    await expect(page).toHaveURL(/\/diagnose\?printer=creality-ender-3-v2/);
    await expect(page.getByText("Creality Ender-3 V2").first()).toBeVisible();
  });

  test("starts from a symptom category", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Stringing, blobs and surface quality/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stringing, blobs and surface quality");
    await page.getByRole("link", { name: /Diagnose this/ }).first().click();
    await expect(page.getByRole("heading", { name: "What does the problem look like?" })).toBeVisible();
  });
});

test("completes a diagnosis, follows the repair guide and returns when not fixed", async ({ page }) => {
  await page.goto("/diagnose/first-layer-adhesion?printer=creality-ender-3-v2");
  for (const answer of [/never sticks and is dragged around/, /Round, like a piece of string/, /Recently, with dish soap/, /^PLA$/, /Yes, within the range/]) {
    await page.getByRole("button", { name: answer }).click();
  }
  await expect(page.getByRole("heading", { name: "The nozzle is too far from the bed" })).toBeVisible();
  await expect(page.getByText("From your printer's specifications")).toBeVisible();

  await page.getByRole("link", { name: "Start repair guide" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Level the bed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set each corner with a sheet of paper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Measure a fresh bed mesh at temperature" })).toHaveCount(0);

  await page.getByRole("button", { name: "Mark step 1 as done" }).click();
  await expect(page.getByRole("status").filter({ hasText: "steps done" })).toContainText("1 of");

  await page.getByRole("button", { name: "Still not fixed" }).click();
  await page.getByRole("link", { name: /Back to the diagnosis: show the next cause/ }).click();
  await expect(page.getByRole("heading", { name: "Already tried" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The nozzle is too far from the bed" })).toHaveCount(0);
});

test("search finds printers, problems and error messages", async ({ page }) => {
  await page.goto("/search?q=mintemp");
  await expect(page.getByRole("link", { name: /^MINTEMP/ })).toBeVisible();
  await page.goto("/search?q=strining");
  await expect(page.getByRole("link", { name: /Stringing between parts/ })).toBeVisible();
});

test("printer page marks unknown specifications instead of guessing", async ({ page }) => {
  await page.goto("/printers/flashforge-adventurer-5m");
  await expect(page.getByText("Not yet verified").first()).toBeVisible();
  await expect(page.getByText("Not yet reviewed").first()).toBeVisible();
});

test("slicer names follow the printer through guides and printer pages", async ({ page }) => {
  await page.goto("/printers/prusa-mk4");
  await expect(page.getByRole("link", { name: "PrusaSlicer" })).toBeVisible();
  await page.goto("/guides/tune-retraction?printer=prusa-mk4");
  const panel = page.getByRole("region", { name: "Settings" });
  await expect(panel.getByLabel("Slicer")).toHaveValue("prusaslicer");
  await expect(panel.getByText("Avoid crossing perimeters")).toBeVisible();
  // The step itself names the setting in PrusaSlicer.
  await expect(page.getByRole("listitem").filter({ hasText: "In PrusaSlicer: Retraction length" }).first()).toBeVisible();
  await panel.getByLabel("Slicer").selectOption("ultimaker-cura");
  await expect(panel.getByText("Combing Mode")).toBeVisible();
  await expect(page.getByText("In UltiMaker Cura: Retraction Distance").first()).toBeVisible();
  await page.goto("/slicers");
  await expect(page.getByRole("link", { name: /^OrcaSlicer/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^FlashPrint 5/ }).first()).toBeVisible();
});

test("my setup is saved once and used by guides", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /set your printer and slicer/ }).click();
  const setup = page.getByRole("region", { name: "My setup" });
  await setup.getByLabel("Search by manufacturer or model").fill("p1s");
  await setup.getByRole("button", { name: /^Bambu Lab P1S\b/ }).click();
  await expect(setup.getByLabel("Your slicer")).toHaveValue("bambu-studio");
  await setup.getByRole("button", { name: "Done" }).click();
  await page.goto("/guides/reduce-warping");
  await expect(page.getByText(/Showing steps for the Bambu Lab P1S/)).toBeVisible();
  await expect(page.getByText("In Bambu Studio: Brim")).toBeVisible();
});

test("feedback reports say honestly when they are not stored", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your message").fill("The PETG page is missing a drying time for my brand.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your report was not saved.")).toBeVisible();
});

for (const path of ["/", "/diagnose", "/diagnose/heating-faults", "/printers", "/printers/prusa-mk4", "/guides/clear-a-blocked-nozzle", "/filament", "/maintenance", "/error-codes", "/slicers", "/slicers/orcaslicer"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
