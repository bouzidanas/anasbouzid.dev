# How this site is built

Astro builds the site as static HTML.
The interactive parts are Solid islands that use [rhp](https://github.com/bezda-team/rhp), and a few small scripts handle the rest.
Astro renders every island to HTML at build time, so each one shows before any JavaScript runs and hydrates when it's needed.

## Pages

The home page is a stack of section components in `src/components/home/`.
Each project page comes from an MDX file in `src/content/projects/`, rendered by `src/pages/work/[id].astro`.
A project's `order` field sets its place in the grid on the home page.
The Writing section lists the newest three posts in `src/content/posts/`, one Markdown file each, whose frontmatter holds the title, summary, date, link and pictures.
For now the two posts link to the Every Word and Election Night articles.
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
On screens narrower than 40rem it shows only the last 13 weeks, about three months, so each bar has room.
Pointing at a week, tapping it, or tabbing into the chart and using the arrow keys updates the gold readout and puts the week's date under its bar.
The dates at the two ends of the chart fade out only while that date would run into them.
Once the figures have scrolled up under the header, the week's value also shows over its bar.
An `IntersectionObserver` watches the figures, with the page's `scroll-padding-top` as its top margin so that the header counts as out of view.
The first time the chart scrolls into view, its bars grow one after another.

**The counters.**
Each number is a row of digits, and each digit is a CSS counter worked out from `--n`, an integer registered with `@property`.
The tens digit is `--n` divided by 10, rounded down, mod 10, with CSS `round()` and `mod()`.
A digit whose place is above the number takes no room and doesn't show, so a count grows a digit at a time.
The first time the numbers come into view, an animation runs `--n` up from 0.
When fresh statistics arrive, a transition moves `--n` from its displayed value to the new one.
The figure elements stay in place, so a refresh does not restart their entrance.
Each digit rounds down first, because Safari animates a registered integer through fractions and a counter ignores a fraction.
A hidden digit has no width and no opacity rather than being clipped, because clipping would move its baseline in Safari.

**Entrances.**
The counters and the bars share one rule for when they play.
If they're below the screen when the island hydrates, their animations start out paused.
Each one plays once nearly all of it is on screen, or as much of it as fits in a short window, so a number never sits at 0 while you're reading it.
Without JavaScript, or if they're already on screen, they're simply drawn.

**Bolder near the pointer.**
The big figures and "Let's talk." are set one character at a time.
The characters near the pointer get bolder and more amber, the same distance rule that lifts the bars in my name.
`src/lib/swell.ts` sets two numbers on the text every frame: `--tx`, where the bump is, counted in characters, and `--lens`, how strong it is.
Both ease toward the pointer, so the bump glides between pointer events and fades in and out where the pointer enters and leaves, and a rule in `global.css` works out each character's look from them.
The pointer is read against where the characters sit at rest, so a character widening as it swells doesn't move the bump under it.
Fraunces widens as it gets bolder, so each character's box grows only 70% as much as its glyph, which is centered and grows out of the box on both sides.
The word moves less, and bold neighbors still don't touch.
Fraunces is a variable font, so the weight changes smoothly.
One box per letter loses the font's kerning, so `src/lib/kerning.ts` measures each pair as plain text and puts the difference back as a margin.
A wave runs through "Let's talk." the first time it's in view, and the pointer takes over from wherever it is.
Screen readers get each one once, from a hidden copy of the text.

**The project tiles.**
A pointer listener in `Work.astro` sets `--x` and `--y` on the tile under the pointer, and a radial gradient lights the tile at that spot.

**The pixel trail.**
The hero, Selected work and the footer sit on a grid of faint dots.
`src/components/PixelField.astro` is one canvas per section, and the squares near the pointer light up on it and fade out over about a second.
Each grid spans the window and runs from its section's rule down to the next section's rule, through the gap between them, without changing the layout.
The hero's starts at the top of the page, under the header, and the footer's runs from its rule to the bottom of the page, on every page.
The dots are the canvas's CSS background with `background-repeat: space`, which fits whole dots only, so none sits on a rule, and the squares use the same spacing.
The loop that fades the squares stops once the last one is dark.
The page listens for the pointer, not the section, so the hero's canvas lights up under the header too.
It listens in the capture phase, before other listeners change the page, so measuring the canvases doesn't force an extra layout.
A tap lights the squares around the finger.

**The header.**
At the top of the page the header is clear, so the hero's dots run up under it and the two read as one.
Over the first 5rem of scrolling, a scroll-driven animation fades in its frosted glass and draws its border.
The glass is its own layer fixed behind the header, with a fixed tint and blur, and the animation fades its opacity, because Safari doesn't draw a backdrop-filter whose blur is animated.
It sits outside the header because the header's `view-transition-name` would keep a blur inside it from seeing the page.
In browsers without scroll-driven animations, a script clears it at the top of the page instead.

**The Writing list.**
With a mouse, a post's picture follows the pointer while it's over the post.
Without one, or on a narrow screen, each post shows its picture under its text.
`PostCover.astro` holds a post's light and dark pictures and shows the one that matches the site's theme.

**The reveals.**
Project tiles and open-source rows that are below the screen when the page loads fade up once they come into view.
A script in `BaseLayout.astro` watches them with an `IntersectionObserver`.
The ones that arrive together get a growing delay, so the two tiles in a row appear one after another.
Coming back to the page with the back button skips this, so the tile a project page morphs back into is already there.

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
It shares `scripts/stats-source.mjs` with the live endpoint in `worker/index.mjs`.
The loader fetches daily downloads from pypistats and the npm API, adds every package up into 25 calendar weeks, and fetches stars from GitHub.
The monthly figures cover 30 calendar days ending on the latest date shared by every download source.
It writes them to `src/data/stats.json`.
Requests run in parallel, with an eight-second timeout for each source.
If a download source fails or returns unusable data, all download figures and weeks keep their last values so the reporting windows stay consistent.
A failed GitHub request keeps that repository's last star count.

The page shows its build-time statistics immediately.
When the download chart hydrates, `src/lib/stats.ts` requests `/api/stats` and updates the figures, weekly bars, dates and accessible text when the response arrives.
The inline figures on project pages use `src/components/Stat.astro` and share one request per page.
Failed requests leave the saved figures visible, and reduced motion disables the counter transitions.

Cloudflare serves the HTML as static assets and routes `/api/*` through the Worker.
The endpoint caches statistics for six hours, retains them for up to seven days as an outage fallback, and retries incomplete refreshes after five minutes.
Concurrent requests in one Worker instance share a refresh, and query strings cannot bypass the cache.
The optional Worker secret `GITHUB_TOKEN` authenticates GitHub requests without exposing it to browsers.
`npm run dev -- --background` uses the same endpoint with a process-local cache.
`npm run preview:worker` serves the production build with the actual Worker and asset routing.
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
- `src/assets/posts/` holds pictures of the two posts' articles, taken on November 10, 2026 at a 640-pixel-wide window.
  The Election Night one shows the counts from that day.

## Browser features

Each feature has a job.
A browser that lacks one still shows the page, without that effect.

| Feature                      | Where                                                                      |
| :--------------------------- | :------------------------------------------------------------------------- |
| View Transitions             | The card-to-page morph and the theme reveal                                |
| Scroll-driven animations     | The header's frosting and border, and the reading bar                      |
| `round()` and `mod()`        | Each digit of the counters                                                 |
| Variable fonts               | The weight of the characters near the pointer                              |
| Canvas                       | The pixel trail                                                            |
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
If your system asks for less motion, the videos stay still, the animations are off and the squares don't light up.

## Tests

Playwright runs the tests against the production build, in Chromium, WebKit and a phone viewport.
They check every page for console errors, sideways scrolling and the problems axe finds, leaving out the apps embedded from other sites.
They also drive the download chart with a pointer, a finger and the keyboard, check that a phone shows its last three months and that a picked date never covers an end date, click my name, switch the theme, turn on Show writes and start the Quizmark demo.
One more checks that the benchmark chart is on the page with every library and isn't hydrated.
Others check that the squares light up under the pointer from the hero up into the header and in the footer of a project page, and stay dark with less motion, that each grid spans the window from its section's rule to the next one, and that the header is clear at the top of the page and frosted once it scrolls.
They check that each figure shows its number digit by digit, with no leading zeros while it counts, and that the characters near the pointer get bolder.
They check that Writing lists its posts newest first, brings up a post's picture beside the pointer, shows it in the row on a phone and follows the theme.
Others check that the scroll-driven animations are still in the built CSS, that the counters and the bars wait until they come into view, and that tiles arriving together appear one after another.
CI runs them on every push and pull request.
The live statistics tests delay responses to check the saved figures, then verify animated updates, updated chart values, inline figures, reduced motion and failure fallbacks.
Node tests cover reporting windows, parallel requests, invalid upstream data, request coalescing and cache refreshes during outages.

## Type and color

Headings are in Fraunces, text in Geist and numbers in Geist Mono, with Bricolage Grotesque for the rhp posters.
Astro's font API self-hosts them with fallbacks sized to match, so the page doesn't shift when they load.

## Known issues upstream

- rhp's `all: initial` on `.rhp-body` also resets `color-scheme`; adding `color-scheme: inherit` after it would fix it in rhp itself.
- Lightning CSS, Vite's default CSS minifier, folds `animation-timeline` into the `animation` shorthand when it has no browser targets, and Astro builds with none.
  Browsers don't accept a timeline in the shorthand and drop the whole declaration, so `astro.config.mjs` has Vite minify CSS with esbuild instead.
- Quizmark's `demo.js` has three unused variables, which `astro check` reports as hints.
- streamlit-float's `__init__.py` has a regex in a normal string, which raises a `SyntaxWarning` on Python 3.12 and later.
