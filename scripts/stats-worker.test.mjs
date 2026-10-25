import assert from "node:assert/strict";
import test from "node:test";
import { serveStats } from "../worker/index.mjs";
import worker from "../worker/index.mjs";
import { upstream } from "./stats-fixtures.mjs";

function setup() {
  const entries = new Map();
  const work = [];
  return {
    cache: {
      async match(key) {
        return entries.get(key.url)?.clone();
      },
      async put(key, response) {
        entries.set(key.url, response.clone());
      },
    },
    context: {
      waitUntil(promise) {
        work.push(promise);
      },
    },
    work,
  };
}

test("the endpoint coalesces requests, caches for six hours, and retains fresh values on failure", async (t) => {
  t.mock.method(console, "warn", () => {});
  let now = 0;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async (url) => upstream(url));
  const { cache, context, work } = setup();
  const request = new Request("https://portfolio.example/api/stats");
  const call = (req = request) => serveStats(req, {}, context, cache);
  const responses = await Promise.all([call(), call()]);
  await Promise.all(work);
  assert.equal(fetch.mock.callCount(), 18);
  const fresh = await responses[0].json();
  assert.equal(fresh.github["bezda-team/rhp"].stars, 100);
  assert.equal(responses[0].headers.get("Cache-Control"), "public, max-age=300");

  assert.deepEqual(await (await call(new Request(request.url + "?bypass=1"))).json(), fresh);
  assert.equal(fetch.mock.callCount(), 18);
  now = 6 * 60 * 60 * 1000 + 1;
  fetch.mock.mockImplementation(async () => new Response(null, { status: 503 }));
  assert.deepEqual(await (await call()).json(), fresh);
  assert.equal(fetch.mock.callCount(), 36);
  assert.deepEqual(await (await call()).json(), fresh);
  assert.equal(fetch.mock.callCount(), 36);
  await Promise.all(work);
});

test("unsupported methods cannot refresh statistics and other paths serve static assets", async () => {
  const { cache, context } = setup();
  assert.equal(
    (
      await serveStats(
        new Request("https://portfolio.example/api/stats", { method: "POST" }),
        {},
        context,
        cache,
      )
    ).status,
    405,
  );
  const response = await worker.fetch(
    new Request("https://portfolio.example/work/rhp/"),
    {
      ASSETS: { fetch: () => new Response("project") },
    },
    context,
  );
  assert.equal(await response.text(), "project");
});
