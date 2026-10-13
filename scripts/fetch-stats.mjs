import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../src/data/stats.json", import.meta.url);

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

const previous = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { "user-agent": "anasbouzid.dev", ...headers } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}

const sum = (days) => days.reduce((total, day) => total + day.downloads, 0);

async function pypiDays(name) {
  const { data } = await getJson(`https://pypistats.org/api/packages/${name}/overall?mirrors=false`);
  return data
    .filter((row) => row.category === "without_mirrors")
    .map((row) => ({ date: row.date, downloads: row.downloads }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function npmDays(name) {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 200 * DAY).toISOString().slice(0, 10);
  const { downloads } = await getJson(`https://api.npmjs.org/downloads/range/${start}:${end}/${name}`);
  return downloads.map((row) => ({ date: row.day, downloads: row.downloads }));
}

async function stars(repo) {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const { stargazers_count } = await getJson(`https://api.github.com/repos/${repo}`, headers);
  return { stars: stargazers_count };
}

// Every package's daily downloads added up, in whole weeks counted back from the last day all sources have.
function weekly(series) {
  const totals = new Map();
  for (const days of series) {
    for (const { date, downloads } of days) totals.set(date, (totals.get(date) ?? 0) + downloads);
  }
  const last = series.map((days) => days[days.length - 1].date).sort()[0];
  const dates = [...totals.keys()].filter((date) => date <= last).sort();

  const weeks = [];
  for (let end = dates.length; weeks.length < WEEKS && end >= 7; end -= 7) {
    const week = dates.slice(end - 7, end);
    weeks.unshift({ start: week[0], downloads: week.reduce((total, date) => total + totals.get(date), 0) });
  }
  return weeks;
}

// If a source is down, keep the last numbers we had so the build still works.
async function attempt(label, load, fallback) {
  try {
    return await load();
  } catch (error) {
    console.warn(`stats: kept the previous ${label} (${error.message})`);
    return fallback;
  }
}

const daily = {};
for (const name of pypiPackages) daily[name] = await attempt(name, () => pypiDays(name));
for (const name of npmPackages) daily[name] = await attempt(name, () => npmDays(name));

const complete = Object.values(daily).every(Boolean);
const lastMonth = (section, names) =>
  Object.fromEntries(
    names.map((name) => [
      name,
      daily[name] ? { lastMonth: sum(daily[name].slice(-30)) } : previous[section]?.[name],
    ]),
  );

const github = {};
for (const repo of repos) {
  github[repo] = await attempt(repo, () => stars(repo), previous.github?.[repo]);
}

const stats = {
  updated: new Date().toISOString().slice(0, 10),
  weeks: complete ? weekly(Object.values(daily)) : previous.weeks,
  pypi: lastMonth("pypi", pypiPackages),
  npm: lastMonth("npm", npmPackages),
  github,
};

await writeFile(file, JSON.stringify(stats, null, 2) + "\n");
console.log(`stats: updated ${file.pathname}`);
