# anasbouzid.dev

My portfolio site: static Astro, with Solid islands drawn by [rhp](https://github.com/bezda-team/rhp).
[How this site is built](HOW-THIS-SITE-IS-BUILT.md) covers the interactive parts, the data, the media and the tests.

## Commands

| Command           | What it does                                                                         |
| :---------------- | :----------------------------------------------------------------------------------- |
| `npm run dev`     | Local dev server                                                                     |
| `npm run stats`   | Refreshes download counts and stars in `src/data/stats.json`                         |
| `npm run build`   | Type checks and builds to `dist/` (refreshes the stats first)                        |
| `npm run preview` | Serves the build                                                                     |
| `npm test`        | Playwright and axe tests against the build, in Chromium, WebKit and a phone viewport |
| `npm run format`  | Prettier                                                                             |

## Where things are

| Path                    | What                                                       |
| :---------------------- | :--------------------------------------------------------- |
| `src/content/projects/` | The case studies, one MDX file per project                 |
| `src/components/solid/` | The chart islands                                          |
| `src/data/`             | `stats.json` (generated) and the open-source contributions |
| `src/assets/projects/`  | Poster frames for the project videos                       |
| `public/media/`         | Project clips, H.264 at 960×600                            |

To add a project, add an MDX file whose frontmatter matches `src/content.config.ts`, a poster in `src/assets/projects/` and a clip in `public/media/`.
