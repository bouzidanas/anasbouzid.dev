import { expect, test } from "@playwright/test";
import saved from "../src/data/stats.json" with { type: "json" };

test("the production Worker serves statistics separately from the static pages", async ({
  request,
}) => {
  const response = await request.get("/api/stats");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(response.headers()["cache-control"]).toBe("public, max-age=300");
  const stats = await response.json();
  expect(stats.weeks).toHaveLength(25);
  expect(stats.github["bezda-team/rhp"].stars).toBeGreaterThanOrEqual(0);
  expect(stats.pypi["streamlit-code-editor"].lastMonth).toBeGreaterThanOrEqual(0);
});

test("saved statistics stay visible while fresh statistics load, then animate to the new values", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const fresh = structuredClone(saved);
  fresh.github["bezda-team/rhp"].stars += 100;
  fresh.pypi["streamlit-code-editor"].lastMonth += 10000;
  fresh.weeks[fresh.weeks.length - 1].downloads = 123456;
  let requested = false;
  await page.route("**/api/stats", async (route) => {
    requested = true;
    await pending;
    await route.fulfill({ json: fresh });
  });

  await page.goto("/");
  const counters = page.locator("[class*=_count_]");
  await counters.first().scrollIntoViewIfNeeded();
  const island = page.locator("astro-island", { has: counters.first() });
  await expect(island).not.toHaveAttribute("ssr");
  const stars = counters.nth(1);
  const original = Object.values(saved.github).reduce((sum, repo) => sum + repo.stars, 0);
  await expect(stars).toHaveCSS("--n", String(original));
  await expect.poll(() => requested, { timeout: 2000 }).toBe(true);
  // Finish the entrance so this checks an update of an already visible number.
  await stars.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  release();
  await expect(stars).toHaveAttribute("style", new RegExp(`--n:\\s*${original + 100}`));
  const animated = await stars.evaluate((element) => {
    const animation = element
      .getAnimations()
      .find((animation) => animation instanceof CSSTransition);
    if (!animation) return false;
    animation.pause();
    animation.currentTime = 600;
    const value = Number(getComputedStyle(element).getPropertyValue("--n"));
    animation.finish();
    return value;
  });
  expect(animated).toBeGreaterThan(original);
  expect(animated).toBeLessThan(original + 100);
  await expect(page.getByText("123,456", { exact: true }).first()).toBeVisible();
  await expect(page.locator("[data-week]").last()).toContainText("123,456 downloads");
});

for (const failure of ["unavailable", "invalid", "disconnected"]) {
  test(`saved statistics survive a response that is ${failure}`, async ({ page, isMobile }) => {
    await page.route("**/api/stats", async (route) => {
      if (failure === "disconnected") return route.abort();
      if (failure === "unavailable") return route.fulfill({ status: 503 });
      return route.fulfill({ json: { weeks: [] } });
    });
    await page.goto("/");
    const counters = page.locator("[class*=_count_]");
    await counters.first().scrollIntoViewIfNeeded();
    await expect(page.locator("astro-island", { has: counters.first() })).not.toHaveAttribute(
      "ssr",
    );
    await expect(counters.first()).toHaveCSS("--n", "8");
    await expect(page.locator("[data-week]")).toHaveCount(isMobile ? 13 : saved.weeks.length);
    await expect(page.getByText("GitHub stars on my projects")).toBeVisible();
  });
}

test("reduced motion updates statistics without a count animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const fresh = structuredClone(saved);
  fresh.github["bezda-team/rhp"].stars += 100;
  await page.route("**/api/stats", (route) => route.fulfill({ json: fresh }));
  await page.goto("/");
  const stars = page.locator("[class*=_count_]").nth(1);
  await stars.scrollIntoViewIfNeeded();
  const expected = Object.values(fresh.github).reduce((sum, repo) => sum + repo.stars, 0);
  await expect(stars).toHaveCSS("--n", String(expected));
  expect(await stars.evaluate((element) => element.getAnimations().length)).toBe(0);
});

test("inline project statistics share one refresh and keep their server-rendered fallback", async ({
  page,
}) => {
  const fresh = structuredClone(saved);
  fresh.pypi["streamlit-code-editor"].lastMonth = 123456;
  fresh.github["bouzidanas/streamlit-code-editor"].stars = 321;
  let requests = 0;
  await page.route("**/api/stats", (route) => {
    requests++;
    return route.fulfill({ json: fresh });
  });
  await page.goto("/work/streamlit/");
  await expect(page.locator('[data-stat-name="streamlit-code-editor"]')).toHaveText("123,456");
  await expect(page.locator('[data-stat-name="bouzidanas/streamlit-code-editor"]')).toHaveText(
    "321",
  );
  expect(requests).toBe(1);
});
