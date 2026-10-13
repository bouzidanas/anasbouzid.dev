export const theme = {
  font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  ink: "#273149",
  muted: "#69718a",
  grid: "#e3ded2",
  surface: "#f4f1e9",
};

// A part of the pie: a wedge round, a segment of one stacked bar flat.
export const part = `
/* No size container: it would put each slat in a layer of its own, and later wedges would cover earlier labels. */
.slat { pointer-events: none; }
.tag { z-index: 1; }

/* --- round --- */

/* The Bar gives up its box to the pie's square: --s its side, --cx, --cy its middle, in the room the tubes leave.
   On a narrow poster it takes the whole width, at the top. */
.slat:vertical { --w: calc(100cqw - var(--bars) - var(--between)); --s: min(var(--w), var(--rhp-height)); --cx: calc(var(--w) / 2); --cy: 50%; }
@container (max-width: 440px) {
  .slat:vertical { --w: 100cqw; --cy: calc(var(--s) / 2); }
}
.slat:vertical .slice { inset: auto; left: calc(var(--cx) - var(--s) / 2); top: calc(var(--cy) - var(--s) / 2);
  width: var(--s); height: var(--s); translate: none; background: none; }
.slat:vertical .slice svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

/* The stroke rounds the corners. The shadow is even all round, and on the svg, as Safari won't filter a path. */
.slice path { fill: var(--rhp-color); stroke: var(--rhp-color); stroke-width: 4.4; stroke-linejoin: round; }
.slice .wedge { filter: drop-shadow(0 0 1.6px rgb(39 49 73 / .26)); }

.lead { fill: none; stroke: var(--rhp-ink); stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 0 4.5; vector-effect: non-scaling-stroke;
  animation: lead-in .3s ease-out; }
@keyframes lead-in { from { opacity: 0; } }

/* A label sits at --fx, --fy from the square's middle, hanging back --ax, --ay of its size; --fit shrinks it. */
.slat:vertical .tag { left: calc(var(--cx) + var(--s) * var(--fx)); top: calc(var(--cy) + var(--s) * var(--fy)); bottom: auto;
  translate: calc(var(--ax) * 100%) calc(var(--ay) * 100%); padding: 0; --fit: clamp(.72, .45 + var(--share) * 2.75, 1); }
.slat:vertical .tag b { font-size: calc(var(--s) * .12 * var(--fit)); }
.slat:vertical .tag span { font-size: clamp(9px, calc(var(--s) * .04 * var(--fit)), 15px); }
.slat:vertical .tag.out b { font-size: calc(var(--s) * .072); }
.slat:vertical .tag.out span { font-size: clamp(9px, calc(var(--s) * .032), 13px); }

/* --- flat: rhp draws the stacked bar, in the band at the top --- */

.slat:horizontal .slice svg { display: none; }
.slat:horizontal .slice { top: 0; bottom: auto; height: var(--strip); translate: none; --rhp-gap: 4px; --rhp-radius: 10px; }
.slat:horizontal .tag { top: calc(var(--strip) / 2); translate: -50% -50%; padding: 0; opacity: clamp(0, (var(--share) - .05) * 40, 1); }
.slat:horizontal .tag b { font-size: 22px; }
.slat:horizontal .tag span { display: none; }

/* --- either way --- */

.tag { color: var(--rhp-ink); text-align: center; white-space: normal; }
.tag b { display: block; font-weight: 650; line-height: 1; letter-spacing: -.04em; }
.tag sup { font-size: .36em; vertical-align: top; position: relative; top: .1em; margin-left: .06em; letter-spacing: 0; }
.tag span { display: block; width: max-content; max-width: 8em; margin: .4em auto 0; font-weight: 500; line-height: 1.25; }
`;

// A generation: an outlined tube filled in its own color, with its share and name under it.
export const gen = `
/* Only the tube and its share and name take the pointer. */
.slat { pointer-events: none; }
:is(.fill, .tube, .name) { pointer-events: auto; cursor: pointer; }
.slat:focus-visible { outline: none; }

/* The <i> in each Bar draws the fill and the outline, so picking eases in both versions. */
.fill, .tube { background: none; }
:is(.fill, .tube) i { position: absolute; inset: 0; transition: opacity .25s, background-color .25s, border-width .2s; }
.fill i { background: var(--rhp-color); border-radius: 0 0 14px 14px; }
.tube i { border: 2.5px solid var(--rhp-ink); border-radius: 14px; }
.slat:is(:hover, :focus-visible, .on) .tube i { border-width: 3.5px; }
.name :is(b, span) { transition: opacity .25s; }
.slat.off :is(.fill i, .tube i, .name b, .name span) { opacity: .38; }

.name { color: var(--rhp-ink); text-align: center; --rhp-label-gap: 10px; }
.name b { display: block; font-weight: 650; line-height: 1; letter-spacing: -.035em; }
.name span { display: block; margin-top: 5px; font-weight: 500; }

/* --- round --- */

/* A tube runs from --low, above its name, up to 18px under the paragraph (--side), and on a narrow poster under the
   pie too. */
.slat:vertical { --big: clamp(17px, 3.4cqw, 30px); --small: clamp(9.5px, 1.45cqw, 14px);
  --low: calc(var(--big) + var(--small) * 1.2 + 19px); --tall: max(0px, calc(100% - var(--low) - var(--side) - 18px)); }
@container (max-width: 440px) {
  .slat:vertical { --tall: max(0px, calc(100% - var(--low) - 100cqw - var(--side) - 40px)); }
}
.slat:vertical :is(.fill, .tube) { bottom: calc(var(--low) + var(--rhp-lo) * var(--tall)); height: calc((var(--rhp-hi) - var(--rhp-lo)) * var(--tall)); }
.slat:vertical .name { bottom: var(--low); }
.slat:vertical .name b { font-size: var(--big); }
.slat:vertical .name span { font-size: var(--small); }

/* --- flat --- */

.slat:horizontal .fill i { border-radius: 12px 0 0 12px; }
.slat:horizontal .tube i { border-radius: 12px; }
.slat:horizontal .name { display: flex; align-items: baseline; gap: 8px; text-align: right; }
.slat:horizontal .name b { order: 2; font-size: 17px; min-width: 2.4em; }
.slat:horizontal .name span { margin: 0; font-size: 13px; }
`;
