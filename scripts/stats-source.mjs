import { downloadsInLast30Days } from "./stats-periods.mjs";

const pypiPackages = [
  "streamlit-code-editor",
  "streamlit-float",
  "streamlit-dnd",
  "streamlit-reveal-slides",
];
const npmPackages = ["@bezda/rhp", "@bezda/rhp-mcp", "pr-ui-compare", "react-list-player"];
const repos = [
  "bezda-team/rhp",
  "bouzidanas/pynote-notebook-editor",
  "bouzidanas/streamlit-code-editor",
  "bouzidanas/streamlit-float",
  "bouzidanas/streamlit-dnd",
  "bouzidanas/streamlit-reveal-slides",
  "bouzidanas/react-list-player",
  "bouzidanas/react-reveal-slides",
  "bouzidanas/lyr-ix",
  "bouzidanas/playwright-comparison-gif-maker",
];

// pypistats keeps 180 days, so 25 whole weeks fit in every source.
const WEEKS = 25;
const DAY = 24 * 60 * 60 * 1000;

export async function fetchStats(previous, { token, request = fetch, now = new Date() } = {}) {
  async function getJson(url, headers = {}) {
    const response = await request(url, {
      headers: { "user-agent": "anasbouzid.dev", ...headers },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`${response.status} from ${url}`);
    return response.json();
  }

  async function pypiDays(name) {
    const { data } = await getJson(
      `https://pypistats.org/api/packages/${name}/overall?mirrors=false`,
    );
    if (!Array.isArray(data)) throw new Error("Missing daily downloads");
    return validateDays(
      data
        .filter((row) => row.category === "without_mirrors")
        .map((row) => ({ date: row.date, downloads: row.downloads }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    );
  }

  async function npmDays(name) {
    const end = new Date(now.getTime() - DAY).toISOString().slice(0, 10);
    const start = new Date(now.getTime() - 200 * DAY).toISOString().slice(0, 10);
    const { downloads } = await getJson(
      `https://api.npmjs.org/downloads/range/${start}:${end}/${name}`,
    );
    return validateDays(downloads.map((row) => ({ date: row.day, downloads: row.downloads })));
  }

  async function stars(repo) {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    const { stargazers_count } = await getJson(`https://api.github.com/repos/${repo}`, headers);
    if (!Number.isSafeInteger(stargazers_count) || stargazers_count < 0)
      throw new Error("Invalid star count");
    return { stars: stargazers_count };
  }

  // Every package's daily downloads added up, in whole weeks counted back from the last day all sources have.
  function weekly(series) {
    const totals = new Map();
    for (const days of series) {
      for (const { date, downloads } of days) totals.set(date, (totals.get(date) ?? 0) + downloads);
    }
    const last = series.map((days) => days[days.length - 1].date).sort()[0];
    const weeks = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const end = Date.parse(last) - i * 7 * DAY;
      const start = new Date(end - 6 * DAY).toISOString().slice(0, 10);
      weeks.push({
        start,
        downloads: Array.from(
          { length: 7 },
          (_, day) => totals.get(new Date(end - day * DAY).toISOString().slice(0, 10)) ?? 0,
        ).reduce((sum, value) => sum + value, 0),
      });
    }
    return weeks;
  }

  let complete = true;
  // A failed source keeps the last known values, at build time and at runtime.
  async function attempt(label, load, fallback) {
    try {
      return await load();
    } catch (error) {
      complete = false;
      console.warn(`stats: kept the previous ${label} (${error.message})`);
      return fallback;
    }
  }

  const names = [...pypiPackages, ...npmPackages];
  const [series, entries] = await Promise.all([
    Promise.all(
      names.map((name) =>
        attempt(name, () => (pypiPackages.includes(name) ? pypiDays(name) : npmDays(name))),
      ),
    ),
    Promise.all(
      repos.map(async (repo) => [
        repo,
        await attempt(repo, () => stars(repo), previous.github?.[repo]),
      ]),
    ),
  ]);
  const downloadsComplete = series.every(Boolean);
  const daily = Object.fromEntries(names.map((name, i) => [name, series[i]]));
  const monthEnd = downloadsComplete ? series.map((days) => days.at(-1).date).sort()[0] : undefined;
  const lastMonth = (section, packages) =>
    downloadsComplete
      ? Object.fromEntries(
          packages.map((name) => [
            name,
            {
              lastMonth: downloadsInLast30Days(daily[name], monthEnd),
            },
          ]),
        )
      : previous[section];
  const github = Object.fromEntries(entries);

  const stats = {
    updated: complete ? now.toISOString().slice(0, 10) : previous.updated,
    weeks: downloadsComplete ? weekly(series) : previous.weeks,
    pypi: lastMonth("pypi", pypiPackages),
    npm: lastMonth("npm", npmPackages),
    github,
  };

  return { stats, complete };
}

function validateDays(days) {
  if (
    !days.length ||
    days.some(
      ({ date, downloads }) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(downloads) || downloads < 0,
    )
  )
    throw new Error("Invalid daily downloads");
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
