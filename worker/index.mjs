import saved from "../src/data/stats.json" with { type: "json" };
import { fetchStats } from "../scripts/stats-source.mjs";

const pending = new Map();
const HOUR = 60 * 60 * 1000;

export async function serveStats(request, env, context, cache) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  // Ignore query parameters so visitors cannot bypass the shared cache.
  const key = new Request(new URL("/api/stats", request.url));
  const cached = await cache.match(key);
  const previous = cached ? await cached.json() : undefined;
  let stats = previous?.stats ?? saved;
  if (!previous || previous.refreshAfter <= Date.now()) {
    let refresh = pending.get(key.url);
    if (!refresh) {
      refresh = (async () => {
        const result = await fetchStats(stats, { token: env.GITHUB_TOKEN });
        const body = {
          stats: result.stats,
          refreshAfter: Date.now() + (result.complete ? 6 * HOUR : 5 * 60 * 1000),
        };
        // Retain the last successful values through temporary upstream outages.
        await cache.put(
          key,
          Response.json(body, { headers: { "Cache-Control": "public, max-age=604800" } }),
        );
        return result.stats;
      })();
      pending.set(key.url, refresh);
      context.waitUntil(refresh.finally(() => pending.delete(key.url)));
    }
    stats = await refresh;
  }
  return new Response(request.method === "HEAD" ? null : JSON.stringify(stats), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}

export default {
  fetch(request, env, context) {
    if (new URL(request.url).pathname === "/api/stats") {
      return serveStats(request, env, context, caches.default);
    }
    return env.ASSETS.fetch(request);
  },
};
