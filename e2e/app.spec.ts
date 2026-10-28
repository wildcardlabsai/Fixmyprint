import { expect, test, type Page } from "@playwright/test";

/** Picture cards are labelled radio buttons; people click the card itself. */
const pickCard = async (page: Page, name: RegExp) => {
  await page.locator("label", { has: page.getByRole("radio", { name }) }).click();
  await expect(page.getByRole("radio", { name })).toBeChecked();
};

test.describe("landing page", () => {
  test("hero actions, search and image work", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("section").filter({ has: page.getByRole("heading", { level: 1 }) });
    const image = hero.getByRole("img", { name: /^Illustration:/ });
    await expect(image).toBeVisible();
    expect(await image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    const search = hero.getByLabel("Search by printer model, manufacturer, symptom, or error code");
    await search.fill("mk4s");
    await expect(hero.getByRole("option", { name: /Printer.*MK4S/ })).toBeVisible();
    await search.fill("mintemp");
    await expect(hero.getByRole("option", { name: /Error message.*MINTEMP/ })).toBeVisible();
    await search.fill("stringing");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=stringing/);

    await page.goto("/");
    await page.getByRole("link", { name: "Find my printer" }).click();
    await expect(page).toHaveURL(/#find-printer$/);
    await expect(page.locator("#find-printer").getByLabel("Search by manufacturer or model")).toBeInViewport();
    await page.getByRole("link", { name: "Diagnose a problem" }).first().click();
    await expect(page).toHaveURL(/\/diagnose$/);
  });

  test("puts the main actions before the image on phones", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile");
    await page.goto("/");
    const top = async (l: ReturnType<typeof page.locator>) => (await l.boundingBox())!.y;
    const cta = await top(page.getByRole("link", { name: "Diagnose a problem" }).first());
    const search = await top(page.getByLabel("Search by printer model, manufacturer, symptom, or error code"));
    const image = await top(page.getByRole("img", { name: /^Illustration:/ }));
    expect(cta).toBeLessThan(image);
    expect(search).toBeLessThan(image);
  });

  test("starts a diagnosis from a selected printer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Let’s get your printer working again.");
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
    // Choosing "Stringing" answers the first question, so the diagnosis continues from the next one.
    await expect(page.getByText("The problem you chose")).toBeVisible();
    await expect(page.getByRole("heading", { name: /hear popping or crackling/ })).toBeVisible();
  });
});

test("completes a diagnosis, follows the repair guide and returns when not fixed", async ({ page }) => {
  await page.goto("/diagnose/first-layer-adhesion?printer=creality-ender-3-v2");
  for (const answer of [/never sticks and is dragged around/, /Round, like a piece of string/, /Recently, with dish soap/, /^PLA$/, /Yes, within the range/]) {
    await page.getByRole("button", { name: answer }).click();
  }
  await expect(page.getByRole("heading", { name: "The nozzle is too far from the bed" })).toBeVisible();
  await expect(page.getByText("From your printer's specifications")).toBeVisible();

  await page.getByRole("link", { name: "Open the step-by-step guide" }).click();
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

test("visual diagnosis: pick a picture, compare with your own photo, and reach a result", async ({ page }) => {
  await page.goto("/diagnose");
  await pickCard(page, /Corners lifting or warping/);
  await page.getByRole("link", { name: /Continue/ }).click();
  await expect(page.getByText("The problem you chose")).toBeVisible();
  // The follow-up question compares pictures.
  await expect(page.getByRole("heading", { name: "Which picture looks most like your print?" })).toBeVisible();
  await page.getByRole("button", { name: /Every corner lifts/ }).click();

  // An optional photo, kept in the browser and labelled as not analysed.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64");
  await page.locator(`input[type="file"]`).setInputFiles({ name: "print.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("img", { name: "Your photo of the print" })).toBeVisible();

  for (const a of [/Within the first few layers/, /Smooth PEI/, /^PLA$/, /Open, near a window/, /It sticks well, and I'm not using a brim/]) {
    await page.getByRole("button", { name: a }).click();
  }
  await expect(page.getByRole("heading", { name: "What you reported" })).toBeVisible();
  await expect(page.getByText("(not analysed)")).toBeVisible();
  await expect(page.getByText("These instructions are general")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to fix it" })).toBeVisible();
});

test("resin printers get resin problems and resin-specific advice", async ({ page }) => {
  await page.goto("/diagnose?printer=elegoo-saturn-4-ultra-16k");
  await expect(page.getByRole("radio", { name: /Corners lifting or warping/ })).toHaveCount(0);
  await pickCard(page, /Prints failing to stick to the build plate/);
  await page.getByRole("link", { name: /Continue/ }).click();
  // The printer levels itself, so that question is answered from its specifications.
  await page.getByRole("button", { name: /Yes, the resin maker's settings/ }).click();
  await page.getByRole("button", { name: /Cool: an unheated room/ }).click();
  await expect(page.getByText("Confirmed specifications used for the Elegoo Saturn 4 Ultra 16K")).toBeVisible();
  await expect(page.getByText(/sheet of paper on the screen/)).toHaveCount(0);
});

test("search finds printers, problems and error messages", async ({ page }) => {
  await page.goto("/search?q=mintemp");
  await expect(page.getByRole("link", { name: /^MINTEMP/ })).toBeVisible();
  await page.goto("/search?q=strining");
  await expect(page.getByRole("link", { name: /Stringing and fine hairs/ })).toBeVisible();
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

for (const path of ["/", "/diagnose", "/diagnose/heating-faults", "/printers", "/printers/prusa-mk4", "/guides/clear-a-blocked-nozzle", "/filament", "/maintenance", "/error-codes", "/slicers", "/slicers/orcaslicer", "/diagnose/warping-and-dimensions?symptom=warping", "/printers/elegoo-mars-5-ultra"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
