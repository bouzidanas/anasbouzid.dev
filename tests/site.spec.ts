import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { updates } from "../src/data/benchmark";

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

test("scroll-driven animations survive the build", async ({ page }) => {
  const animationName = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => getComputedStyle(element).animationName);

  await page.goto("/");
  test.skip(
    !(await page.evaluate(() => CSS.supports("animation-timeline: view()"))),
    "no scroll-driven animations",
  );
  expect(await animationName(".tile")).toBe("reveal");
  expect(await animationName(".header")).toBe("settle");

  await page.goto("/work/rhp/");
  expect(await animationName(".progress")).toBe("progress");
});

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

test("the figures count up and the bars grow when they first come into view", async ({ page }) => {
  await page.goto("/");
  const count = page.locator("[class*=_count_]").nth(1);
  const plot = page.getByRole("figure", {
    name: "Weekly downloads of my packages on PyPI and npm",
  });
  const week = page.locator("[data-week]").first();

  // Close enough for the island to hydrate, with all of it still below the screen.
  await page
    .locator("[class*=_figures_]")
    .evaluate((element) => scrollBy(0, element.getBoundingClientRect().top - innerHeight - 50));
  await expect(count).toHaveAttribute("data-entrance", "hold");
  await expect(week).toHaveAttribute("data-entrance", "hold");

  await count.scrollIntoViewIfNeeded();
  await expect(count).toHaveAttribute("data-entrance", "play");
  // Partway through, the counter still holds a whole number, which Safari needs calc() for.
  const counterReset = await count.evaluate((element) => {
    element.getAnimations()[0].currentTime = 600;
    return getComputedStyle(element).counterReset;
  });
  expect(counterReset).toMatch(/^n \d+$/);

  await plot.scrollIntoViewIfNeeded();
  await expect(week).toHaveAttribute("data-entrance", "play");
});

test("the picked week's value shows over its bar once the figures scroll away", async ({
  page,
}) => {
  await page.goto("/");
  await hydrated(page, "[data-week]");
  const week = page.locator("[data-week]").nth(4);
  const figures = page.getByRole("list").filter({ hasText: "packages on PyPI and npm" });
  const tip = page.locator("[class*=_tip_]");

  await week.focus();
  await figures.scrollIntoViewIfNeeded();
  await expect(tip).toHaveCount(0);

  await figures.evaluate((list) => scrollBy(0, list.getBoundingClientRect().bottom));
  await expect(tip).toBeVisible();
  await expect(week).toContainText(`: ${await tip.textContent()} downloads`);

  const { violations } = await new AxeBuilder({ page })
    .include("section[aria-labelledby=numbers-title]")
    .analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
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

test("the benchmark chart is drawn without a script", async ({ page }) => {
  await page.goto("/work/rhp/");

  const chart = page.getByRole("figure", { name: /from a data change to the new frame/ });
  await expect(chart.getByRole("listitem")).toHaveCount(updates.length);
  await expect(chart.locator("xpath=ancestor::astro-island")).toHaveCount(0);
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
