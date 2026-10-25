import { serveStats } from "../worker/index.mjs";

// Use the same endpoint during Astro development, with a process-local cache.
export function statsDev() {
  const entries = new Map();
  const cache = {
    async match(key) {
      return entries.get(key.url)?.clone();
    },
    async put(key, response) {
      entries.set(key.url, response.clone());
    },
  };
  return {
    name: "live-stats",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split("?")[0] !== "/api/stats") return next();
        try {
          const response = await serveStats(
            new Request(`http://localhost${req.url}`, { method: req.method }),
            { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
            {
              waitUntil(promise) {
                void promise.catch(console.error);
              },
            },
            cache,
          );
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
