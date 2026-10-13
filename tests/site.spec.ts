import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const pages = [
  "/",
  "/work/rhp/",
  "/work/pynote/",
  "/work/react/",
  "/work/streamlit/",
  "/work/quizmark/",
  "/work/tools/",
];

for (const path of pages) {
  test(`${path} has no errors, overflow or accessibility violations`, async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Only this site's own messages: the embedded apps on some pages log their own.
    page.on("console", (message) => {
      if (message.type() === "error" && message.location().url.startsWith(baseURL!)) {
        errors.push(message.text());
      }
    });

    await page.goto(path);
    await page.waitForLoadState("load");

    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );

    const { violations } = await new AxeBuilder({ page }).exclude("iframe").analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });
}

// Safari has no requestIdleCallback, so a client:idle or client:visible island hydrates a moment after load.
async function hydrated(page: Page, inside: string) {
  await page.locator(inside).first().scrollIntoViewIfNeeded();
  const island = page.locator("astro-island", { has: page.locator(inside) }).first();
  await expect(island).not.toHaveAttribute("ssr");
}

test("the download chart follows the pointer", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones have no hover");
  await page.goto("/");
  await hydrated(page, "[data-week]");

  await page.locator("[data-week]").nth(3).hover();
  await expect(page.getByText(/downloads, week of/)).toBeVisible();
  await expect(page.locator("[data-week][data-dim]")).toHaveCount(
    (await page.locator("[data-week]").count()) - 1,
  );

  await page.mouse.move(0, 0);
  await expect(page.getByText(/downloads in the latest week/)).toBeVisible();
});

test("a tap on the download chart keeps its week", async ({ page, isMobile }) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/");
  await hydrated(page, "[data-week]");

  await page.locator("[data-week]").nth(5).tap();
  await expect(page.getByText(/downloads, week of/)).toBeVisible();
});

test("the download chart can be read from the keyboard", async ({ page }) => {
  await page.goto("/");
  await hydrated(page, "[data-week]");
  const weeks = page.locator("[data-week]");

  await weeks.first().focus();
  const first = await page.getByText(/downloads, week of/).textContent();
  await page.keyboard.press("ArrowRight");

  await expect(weeks.nth(1)).toBeFocused();
  await expect(page.getByText(/downloads, week of/)).not.toHaveText(first!);
});

test("clicking my name turns it into a bar chart and back", async ({ page }) => {
  await page.goto("/");
  await hydrated(page, "[data-i]");
  const bar = page.locator(".hero .segment").first();
  const span = () =>
    bar.evaluate((el: HTMLElement) =>
      ["--rhp-from", "--rhp-to"].map((name) => Number(el.style.getPropertyValue(name))),
    );
  const letter = await span();

  await page.locator(".hero .word").first().click();
  await expect.poll(span).not.toEqual(letter);
  await expect.poll(span, { timeout: 4000 }).toEqual(letter);
});

test("the theme choice survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Show writes outlines what a strike of the bell changes", async ({ page }) => {
  await page.goto("/work/rhp/");
  await hydrated(page, "[aria-label='Pick a chart']");

  await page.getByRole("button", { name: "Show writes" }).click();
  await page.getByRole("button", { name: "Strike the bell again" }).click();

  const report = page.getByText(/wrote to \d+ of \d+ chart elements/);
  await expect(report).toBeVisible();
  const [, written, total] = (await report.textContent())!.match(/(\d+) of (\d+)/)!.map(Number);
  expect(written).toBeGreaterThan(0);
  expect(written).toBeLessThanOrEqual(total);
});

test("the Quizmark demo opens its first question", async ({ page }) => {
  await page.goto("/work/quizmark/");

  // The demo plays its short intro once the player is in view, then offers the quiz.
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Start" }).click({ timeout: 15000 });
  await expect(page.getByText("Question 1 of 3")).toBeVisible();
});

test("Request my résumé opens a pre-filled email", async ({ page }) => {
  await page.goto("/");

  const href = await page
    .getByRole("link", { name: "Request my résumé" })
    .first()
    .getAttribute("href");
  const url = new URL(href!);
  expect(url.protocol).toBe("mailto:");
  expect(url.searchParams.get("subject")).toBe("Résumé request");
  expect(url.searchParams.get("body")).toContain("current résumé");
});
