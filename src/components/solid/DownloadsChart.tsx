import { createMemo, createSelector, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Bar, Chart, Plot, nice, slat, type Row } from "@bezda/rhp";
import { formatDay, formatNumber } from "../../lib/format";
import { theme } from "../../lib/rhp";
import styles from "./DownloadsChart.module.css";

interface Week {
  start: string;
  downloads: number;
}

interface Figure {
  value: number;
  suffix: string;
  exact: string;
  label: string;
}

interface Props {
  weeks: Week[];
  figures: Figure[];
}

const Column = slat<Week & { dim: boolean; entrance?: "hold" | "grow" }>(
  {
    inset: 0.16,
    room: { start: 0, end: 0, before: 0, after: 0 },
    css: `
      .column { cursor: crosshair; }
      .fill {
        display: block;
        height: 100%;
        border-radius: 2px 2px 0 0;
        background: var(--accent);
        transform-origin: bottom;
        transition: opacity 150ms;
      }
      .column[data-dim] .fill { opacity: 0.28; }
      .say { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
      @media (prefers-reduced-motion: no-preference) {
        .column[data-entrance="hold"] .fill { transform: scaleY(0); }
        .column[data-entrance="grow"] .fill {
          animation: grow 900ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
          animation-delay: calc(var(--i) * 24ms);
        }
      }
      @keyframes grow { from { transform: scaleY(0); } }
    `,
  },
  (d) => (
    <div
      class="column"
      data-week={d.index}
      data-dim={d.dim ? "" : undefined}
      data-entrance={d.entrance}
    >
      <Bar to={d.downloads} color="transparent">
        <span class="fill" style={{ "--i": d.index }} />
      </Bar>
      <span class="say">
        Week of {formatDay(d.start)}: {formatNumber(d.downloads)} downloads
      </span>
    </div>
  ),
);

export default function DownloadsChart(props: Props) {
  const [active, setActive] = createSignal<number>();
  const [figuresInView, setFiguresInView] = createSignal(true);
  const [entrance, setEntrance] = createSignal<"hold" | "grow">();
  const isActive = createSelector(active);
  const scrubbing = createMemo(() => active() !== undefined);
  const latest = () => props.weeks[props.weeks.length - 1];
  const week = () => props.weeks[active() ?? props.weeks.length - 1];
  const x = () => `${((active()! + 0.5) / props.weeks.length) * 100}%`;
  const top = nice(0, Math.max(...props.weeks.map((week) => week.downloads)), 4).max;
  let figures!: HTMLUListElement;
  let plot!: HTMLDivElement;

  // Under the sticky header counts as out of view, and scroll-padding-top covers the header.
  onMount(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const observer = new IntersectionObserver(([entry]) => setFiguresInView(entry.isIntersecting), {
      rootMargin: `${-header}px 0px 0px`,
    });
    observer.observe(figures);
    onCleanup(() => observer.disconnect());
  });

  // Bars still below the screen wait at zero, and grow once the chart is in the top 60% of it.
  onMount(() => {
    if (plot.getBoundingClientRect().top < innerHeight) return;
    setEntrance("hold");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setEntrance("grow");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -40%" },
    );
    observer.observe(plot);
    onCleanup(() => observer.disconnect());
  });

  // An end date steps aside only when the picked week's date would cover it.
  const near = (end: "start" | "end") => {
    const index = active();
    if (index === undefined) return false;
    return end === "start" ? index < 3 : index > props.weeks.length - 4;
  };

  const pick = (event: Event) => {
    const column = (event.target as Element).closest<HTMLElement>("[data-week]");
    if (column) setActive(Number(column.dataset.week));
  };

  // A tap keeps its week after the finger lifts; a mouse leaving the chart clears it.
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setActive(undefined);
  };

  return (
    <div class={styles.downloads}>
      <ul class={styles.figures} role="list" ref={figures}>
        <For each={props.figures}>
          {(figure) => (
            <li>
              <span
                class={styles.count}
                style={{ "--n": figure.value }}
                data-suffix={figure.suffix}
                aria-hidden="true"
              />
              <span class="visually-hidden">{figure.exact}</span>
              <span class={styles.what}>{figure.label}</span>
            </li>
          )}
        </For>
        <li>
          <span class={styles.readout}>{formatNumber(week().downloads)}</span>
          <span class={styles.what}>
            {scrubbing()
              ? `downloads, week of ${formatDay(week().start)}`
              : `downloads in the latest week, from ${formatDay(latest().start)}`}
          </span>
        </li>
      </ul>

      <div
        class={styles.plot}
        ref={plot}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={release}
        onFocusIn={pick}
        onFocusOut={() => setActive(undefined)}
      >
        <Chart
          orientation="vertical"
          scale={[0, top]}
          ticks={false}
          aspect={2.8}
          theme={theme}
          label="Weekly downloads of my packages on PyPI and npm"
        >
          <Plot
            rows={props.weeks}
            dim={(d: Row<Week>) => scrubbing() && !isActive(d.index)}
            entrance={entrance}
            keyboard
          >
            {Column}
          </Plot>
        </Chart>
        <Show when={scrubbing() && !figuresInView()}>
          <span
            class={styles.tip}
            style={{ "--x": x(), "--y": `${(week().downloads / top) * 100}%` }}
            aria-hidden="true"
          >
            {formatNumber(week().downloads)}
          </span>
        </Show>
      </div>
      <div class={styles.axis} aria-hidden="true">
        <span class={styles.end} data-hidden={near("start") ? "" : undefined}>
          {formatDay(props.weeks[0].start)}
        </span>
        <span class={styles.end} data-hidden={near("end") ? "" : undefined}>
          {formatDay(latest().start)}
        </span>
        <Show when={scrubbing()}>
          <span class={styles.picked} style={{ "--x": x() }}>
            {formatDay(week().start)}
          </span>
        </Show>
      </div>
    </div>
  );
}
