# How this site is built

Astro builds the site as static HTML.
The interactive parts are Solid islands that use [rhp](https://github.com/bezda-team/rhp), and a few small scripts handle the rest.
Astro renders every island to HTML at build time, so each one shows before any JavaScript runs and hydrates when it's needed.

## Pages

The home page is a stack of section components in `src/components/home/`.
Each project page comes from an MDX file in `src/content/projects/`, rendered by `src/pages/work/[id].astro`.
A project's `order` field sets its place in the grid on the home page.
The first four show right away, and the rest sit in a `<details>` element behind a Show more button, which opens with an animated height where the browser supports `::details-content`.

`src/components/ProjectMedia.astro` picks what each project shows, on its card and at the top of its page:

| Project                 | Card                                                         | Page                                                       |
| :---------------------- | :----------------------------------------------------------- | :--------------------------------------------------------- |
| rhp                     | The gallery's bell poster, striking itself every few seconds | A switcher across six live charts, with Show writes        |
| PyNote                  | A recorded clip                                              | The live app, with the clip as a fallback                  |
| React components        | A recorded clip                                              | react-list-player's live demo, with the clip as a fallback |
| Streamlit components    | A recorded clip                                              | The same clip, plus one per package in the text            |
| Quizmark                | A recorded clip                                              | The interactive demo from Quizmark's website               |
| Tools for coding agents | A terminal with real rhp-mcp output                          | The same terminal                                          |

## Interactive pieces

**My name.**
`src/components/solid/BarName.tsx` draws the name as an rhp bar chart from the 7-row pixel letters in `src/lib/glyphs.ts`.
A script in `Hero.astro` sets one CSS variable, `--px`, to the column under the pointer, and each column works out its own lift and color from its distance to it.
A click swaps the letters for random bar heights and swaps them back.
The bars are reused by index, so rhp's own transitions move them.

**The download chart.**
`src/components/solid/DownloadsChart.tsx` shows weekly downloads of all the packages added up.
Pointing at a week, tapping it, or tabbing into the chart and using the arrow keys updates the gold readout and puts the week's date under its bar.
Once the figures have scrolled up under the header, the week's value also shows over its bar.
An `IntersectionObserver` watches the figures, with the page's `scroll-padding-top` as its top margin so that the header counts as out of view.
The first time the chart scrolls into view, its bars grow one after another.

**The counters.**
Each number is a CSS counter that reads `--n`, an integer registered with `@property`.
The first time the numbers come into view, an animation runs `--n` up from 0.
The counter reads it through `calc()`, which rounds it, because Safari animates a registered integer through fractions and a counter ignores a fraction.

**Entrances.**
The counters and the bars share one rule for when they play.
If they're below the screen when the island hydrates, their animations start out paused.
Each one plays once nearly all of it is on screen, or as much of it as fits in a short window, so a number never sits at 0 while you're reading it.
Without JavaScript, or if they're already on screen, they're simply drawn.

**The project tiles.**
A pointer listener in `Work.astro` sets `--x` and `--y` on the tile under the pointer, and a radial gradient lights the tile at that spot.

**The theme switch.**
`ThemeToggle.astro` changes the theme inside a View Transition and grows the new theme out of the button with a `clip-path` circle.

**Page changes.**
Cross-document View Transitions morph a project's card media into the media at the top of its page.
An inline script in the layout's head names only the project being opened or returned to, using the `pageswap` and `pagereveal` events.
Naming every card would lift them all out of their rounded cards and over the header while the transition runs.
The reading bar on project pages is a scroll-driven animation.

**The rhp showcase.**
`src/components/solid/RhpShowcase.tsx` shows two gallery posters as Solid components and four recipe pages in same-origin iframes.
Show writes uses a `MutationObserver` to catch the style attributes rhp writes, and draws an outline on each element that follows it every frame while it moves.
An element with no size of its own, like a Place, gets an outline around what it holds.

**The Quizmark demo.**
`src/components/quizmark/` holds the demo from Quizmark's website.
`demo.js` and `lecture.js` are byte-for-byte copies apart from their asset paths.
`quizmark.css` nests the demo's rules under `.quizmark`, so its tokens and base styles stay inside the player and the site's styles stay out of it.
Its `@keyframes` sit at the top level, because a keyframes rule can't be nested inside a style rule.

**The live embeds.**
`LiveEmbed.astro` shows the recorded clip until the app in the iframe loads, then removes the clip.
PyNote opens in its Play Light theme on the light site and Lucide Dark on the dark site.

**The terminal.**
`ToolsTerminal.astro` holds real output from `rhp-mcp check` on one of its broken test charts.
Its lines type in with a `clip-path` reveal once it's on screen, so any text that shows is already at full contrast.

## Data

`scripts/fetch-stats.mjs` runs before each build.
It fetches daily downloads from pypistats and the npm API, adds every package up into 25 whole weeks, and fetches stars from GitHub.
It writes them to `src/data/stats.json`.
If a source is down, the build keeps the last numbers it had.
The open-source list lives in `src/data/contributions.ts`, newest first.

The benchmark chart on the rhp page reads `src/data/benchmark.ts`, which holds the update times from one of rhp's benchmark results files.
`BenchmarkChart.tsx` has no `client:` directive, so Astro renders it to HTML and the page ships no script for it.

## Media

I recorded the clips with Playwright and cut them with FFmpeg into 960×600 H.264 files with poster frames.
The Streamlit clips come from the packages running on my machine in Streamlit's dark theme.
Live Streamlit apps are too heavy to embed.

## Icons

The icon is the A from my name on the amber tile, drawn on whole pixels so it stays sharp at 16 and 32 pixels in a browser tab.
`favicon.svg` is the source.
`favicon.ico` and the home-screen icons (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) are rendered from it, the home-screen ones without the rounded corners because phones round them.

## Copies to update by hand

- `public/rhp/` holds three recipe pages and the beeswarm poster from rhp's documentation site.
- `src/components/solid/gallery/` holds two gallery posters from the same site.
- `src/components/quizmark/demo.js` and `lecture.js` come from Quizmark's `packages/landing`.
- `src/data/benchmark.ts` comes from rhp's `bench/` results, and its link points at the file it was copied from.

## Browser features

Each feature has a job.
A browser that lacks one still shows the page, without that effect.

| Feature                      | Where                                                                      |
| :--------------------------- | :------------------------------------------------------------------------- |
| View Transitions             | The card-to-page morph and the theme reveal                                |
| Scroll-driven animations     | The header's border, the section reveals and the reading bar               |
| `@property`                  | Integer counters, and color tokens that resolve `light-dark()` at the root |
| `light-dark()` and `oklch()` | One line per color for both themes                                         |
| Container queries            | My name sizes itself to its box                                            |
| `:has()`                     | The focus ring around a whole tile when its link has focus                 |
| `text-wrap`                  | Balanced headings and paragraphs without orphans                           |

The color tokens are registered with `@property` because rhp resets `color-scheme` inside its charts with `all: initial`.
Without the registration, `light-dark()` would always pick the light color inside a chart.

## Accessibility

The charts are lists of elements a screen reader can read, and every bar carries its value as text.
Tab reaches the download chart once, and the arrow keys move through its weeks.
If your system asks for less motion, the videos stay still and the animations are off.

## Tests

Playwright runs the tests against the production build, in Chromium, WebKit and a phone viewport.
They check every page for console errors, sideways scrolling and the problems axe finds, leaving out the apps embedded from other sites.
They also drive the download chart with a pointer, a finger and the keyboard, click my name, switch the theme, turn on Show writes and start the Quizmark demo.
One more checks that the benchmark chart is on the page with every library and isn't hydrated.
Two more check that the scroll-driven animations are still in the built CSS, and that the counters and the bars wait until they come into view.
CI runs them on every push and pull request.

## Type and color

Headings are in Fraunces, text in Geist and numbers in Geist Mono, with Bricolage Grotesque for the rhp posters.
Astro's font API self-hosts them with fallbacks sized to match, so the page doesn't shift when they load.

## Known issues upstream

- rhp's `all: initial` on `.rhp-body` also resets `color-scheme`; adding `color-scheme: inherit` after it would fix it in rhp itself.
- Lightning CSS, Vite's default CSS minifier, folds `animation-timeline` into the `animation` shorthand when it has no browser targets, and Astro builds with none.
  Browsers don't accept a timeline in the shorthand and drop the whole declaration, so `astro.config.mjs` has Vite minify CSS with esbuild instead.
- Quizmark's `demo.js` has three unused variables, which `astro check` reports as hints.
- streamlit-float's `__init__.py` has a regex in a normal string, which raises a `SyntaxWarning` on Python 3.12 and later.
