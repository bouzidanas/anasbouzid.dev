import { createSignal, For, Index, onCleanup } from "solid-js";
import { Bar, Chart, Plot, slat } from "@bezda/rhp";
import { columns, ROWS, type Segment } from "../../lib/glyphs";
import { theme } from "../../lib/rhp";

interface Props {
  words: string[];
}

const WORD_GAP = 3;
const ROW_HEIGHT = 1.35;

const Column = slat<{ segments: Segment[]; i: number }>(
  {
    inset: 0.1,
    room: { start: 0, end: 0, before: 0, after: 0 },
    css: `
      .column {
        --lift: max(0, 1 - max(var(--px) - var(--i), var(--i) - var(--px)) / 4);
        cursor: pointer;
      }
      .segment { transition-delay: calc(var(--i) * 9ms); }
      .pixel {
        display: block;
        height: 100%;
        border-radius: 3px;
        background: color-mix(in oklch, var(--accent) calc(var(--lift) * 100%), var(--ink));
        transform-origin: bottom;
        translate: 0 calc(var(--lift) * -0.8 * var(--col));
        transition: translate 300ms cubic-bezier(0.2, 0.7, 0.2, 1), background-color 300ms;
        animation: rise 900ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
        animation-delay: calc(var(--i) * 16ms);
      }
      @keyframes rise { from { transform: scaleY(0); } }
      @media (prefers-reduced-motion: reduce) {
        .pixel { animation: none; transition: none; translate: none; }
      }
    `,
  },
  (d) => (
    <div class="column" data-i={d.i} style={{ "--i": d.i }}>
      <Index each={d.segments}>
        {(segment) => (
          <Bar from={segment().from} to={segment().to} color="transparent" class="segment">
            <span class="pixel" />
          </Bar>
        )}
      </Index>
    </div>
  ),
);

// Columns are numbered across all the words, so one pointer position can lift any of them.
function place(words: string[]) {
  let start = 0;
  return words.map((word) => {
    const segments = columns(word);
    const placed = { segments, start };
    start += segments.length + WORD_GAP;
    return placed;
  });
}

// Heights that wander like real data, between one row and the top.
function wander(count: number) {
  let height = 2 + Math.random() * 4;
  return Array.from({ length: count }, () => {
    height = Math.min(ROWS, Math.max(0.8, height + (Math.random() - 0.5) * 2.6));
    return height;
  });
}

// As a chart, a column is one bar from the baseline; its other segments shrink into that bar's top,
// so the same elements move back when the letters return.
const asBar = (segments: Segment[], height: number) =>
  segments.map((_, k) => (k === 0 ? { from: 0, to: height } : { from: height, to: height }));

export default function BarName(props: Props) {
  const words = place(props.words);
  const [heights, setHeights] = createSignal<number[][]>();
  let timer = 0;

  const scatter = () => {
    clearTimeout(timer);
    setHeights(words.map((word) => wander(word.segments.length)));
    timer = window.setTimeout(() => setHeights(undefined), 1700);
  };

  onCleanup(() => clearTimeout(timer));

  return (
    <For each={words}>
      {(word, w) => {
        const segments = () => {
          const chart = heights()?.[w()];
          return chart ? word.segments.map((column, x) => asBar(column, chart[x])) : word.segments;
        };
        return (
          <div class="word" style={{ "--cols": word.segments.length }} onClick={scatter}>
            <Chart
              orientation="vertical"
              scale={[0, ROWS]}
              ticks={false}
              aspect={word.segments.length / (ROWS * ROW_HEIGHT)}
              theme={theme}
              style={{
                "--rhp-length-time": "0.75s",
                "--rhp-length-ease": "cubic-bezier(0.3, 1.45, 0.5, 1)",
              }}
            >
              <Plot segments={segments()} i={word.segments.map((_, x) => word.start + x)}>
                {Column}
              </Plot>
            </Chart>
          </div>
        );
      }}
    </For>
  );
}
