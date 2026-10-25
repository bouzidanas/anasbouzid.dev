import type saved from "../data/stats.json";
import { formatNumber } from "./format";

export type Stats = typeof saved;

export function figuresFor(stats: Stats) {
  const downloads = [...Object.values(stats.pypi), ...Object.values(stats.npm)].reduce(
    (sum, entry) => sum + entry.lastMonth,
    0,
  );
  const stars = Object.values(stats.github).reduce((sum, repo) => sum + repo.stars, 0);
  const packages = Object.keys(stats.pypi).length + Object.keys(stats.npm).length;
  return [
    { value: packages, suffix: "", exact: String(packages), label: "packages on PyPI and npm" },
    { value: stars, suffix: "", exact: formatNumber(stars), label: "GitHub stars on my projects" },
    {
      value: Math.round(downloads / 1000),
      suffix: "K",
      exact: formatNumber(downloads),
      label: "package downloads in the last 30 days",
    },
  ];
}

let pending: Promise<Stats | undefined> | undefined;

// Each page makes one request, shared by its chart and any inline statistics.
export function latestStats() {
  return (pending ??= fetch("/api/stats", { signal: AbortSignal.timeout(12000) })
    .then(async (response) => {
      if (!response.ok) return;
      const stats = await response.json();
      if (!validStats(stats)) return;
      return stats;
    })
    .catch(() => undefined));
}

function validStats(value: unknown): value is Stats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Stats;
  const valid = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  return (
    Array.isArray(stats.weeks) &&
    stats.weeks.length > 0 &&
    stats.weeks.every(
      (week) =>
        typeof week.start === "string" &&
        Number.isFinite(Date.parse(week.start)) &&
        valid(week.downloads),
    ) &&
    [stats.pypi, stats.npm].every(
      (packages) =>
        packages &&
        Object.keys(packages).length > 0 &&
        Object.values(packages).every((entry) => entry && valid(entry.lastMonth)),
    ) &&
    !!stats.github &&
    Object.keys(stats.github).length > 0 &&
    Object.values(stats.github).every((repo) => repo && valid(repo.stars))
  );
}
