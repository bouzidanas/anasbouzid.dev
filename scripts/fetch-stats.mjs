import { readFile, writeFile } from "node:fs/promises";
import { fetchStats } from "./stats-source.mjs";

const file = new URL("../src/data/stats.json", import.meta.url);
const previous = JSON.parse(await readFile(file, "utf8"));
const { stats } = await fetchStats(previous, { token: process.env.GITHUB_TOKEN });
await writeFile(file, JSON.stringify(stats, null, 2) + "\n");
console.log(`stats: updated ${file.pathname}`);
