import assert from "node:assert/strict";
import test from "node:test";
import saved from "../src/data/stats.json" with { type: "json" };
import { fetchStats } from "./stats-source.mjs";
import { upstream, days } from "./stats-fixtures.mjs";

test("all providers start in parallel with deadlines and share one reporting window", async () => {
  const calls = [];
  const resolvers = [];
  const result = fetchStats(saved, {
    now: new Date("2026-10-16T12:00:00Z"),
    token: "test-token",
    request(url, options) {
      calls.push({ url, options });
      return new Promise((resolve) => resolvers.push(() => resolve(upstream(url))));
    },
  });
  assert.equal(calls.length, 18);
  assert.ok(calls.every(({ options }) => options.signal instanceof AbortSignal));
  assert.ok(
    calls.find(({ url }) => url.includes("api.github.com")).options.headers.authorization ===
      "Bearer test-token",
  );
  assert.ok(calls.find(({ url }) => url.includes("api.npmjs.org")).url.includes(":2026-10-15/"));
  resolvers.forEach((resolve) => resolve());
  const { stats, complete } = await result;
  assert.equal(complete, true);
  assert.equal(stats.pypi["streamlit-code-editor"].lastMonth, 30);
  assert.equal(stats.npm["@bezda/rhp"].lastMonth, 30);
  assert.equal(stats.weeks.length, 25);
  assert.equal(stats.weeks.at(-1).downloads, 56);
  assert.equal(stats.weeks.at(-1).start, "2026-10-09");
});

test("an empty or failed download source keeps the entire reporting window consistent", async (t) => {
  t.mock.method(console, "warn", () => {});
  for (const response of [Response.json({ data: [] }), new Response(null, { status: 429 })]) {
    const { stats, complete } = await fetchStats(saved, {
      request: async (url) =>
        url.includes("streamlit-float") && url.includes("pypistats") ? response : upstream(url),
    });
    assert.equal(complete, false);
    assert.deepEqual(stats.weeks, saved.weeks);
    assert.deepEqual(stats.pypi, saved.pypi);
    assert.deepEqual(stats.npm, saved.npm);
    assert.equal(stats.github["bezda-team/rhp"].stars, 100);
  }
});

test("invalid star counts preserve the last known repository value", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { stats, complete } = await fetchStats(saved, {
    request: async (url) =>
      url.includes("api.github.com/repos/bezda-team/rhp") ? Response.json({}) : upstream(url),
  });
  assert.equal(complete, false);
  assert.deepEqual(stats.github["bezda-team/rhp"], saved.github["bezda-team/rhp"]);
});

test("omitted zero-download days do not stretch a calendar week", async () => {
  const { stats } = await fetchStats(saved, {
    request: async (url) =>
      url.includes("pypistats")
        ? Response.json({
            data: days
              .filter(({ date }) => date !== "2026-10-12")
              .map((day) => ({ ...day, category: "without_mirrors" })),
          })
        : upstream(url),
  });
  assert.equal(stats.weeks.at(-1).start, "2026-10-09");
  assert.equal(stats.weeks.at(-1).downloads, 52);
  assert.equal(stats.pypi["streamlit-float"].lastMonth, 29);
});
