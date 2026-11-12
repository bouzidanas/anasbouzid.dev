import {
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  Index,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Bar, Chart, Plot, nice, slat, type Row } from "@bezda/rhp";
import { formatDay, formatNumber } from "../../lib/format";
import { swell } from "../../lib/swell";
import { theme } from "../../lib/rhp";
import styles from "./DownloadsChart.module.css";
import { figuresFor, latestStats, type Stats } from "../../lib/stats";

interface Week {
  start: string;
  downloads: number;
}

interface Props {
  initial: Stats;
}

type Entrance = "hold" | "play";

// The place of each digit, from the left: 547 has a hundreds, a tens and a ones digit.
const places = (value: number) =>
  [...String(value)].map((_, k, digits) => 10 ** (digits.length - 1 - k));

// Something below the screen holds its animation, and plays it once nearly all of it is on screen,
// or as much of it as fits. A busy page can hand an observer several readings at once, oldest first, so this and
// the observers below go by the latest.
function entrance(element: Element, set: (state: Entrance) => void) {
  const { top, height } = element.getBoundingClientRect();
  if (top < innerHeight) return;
  const threshold = Math.min(0.95, (0.9 * innerHeight) / height);
  set("hold");
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.at(-1)!.intersectionRatio < threshold) return;
      set("play");
      observer.disconnect();
    },
    { threshold },
  );
  observer.observe(element);
  onCleanup(() => observer.disconnect());
}

const Column = slat<Week & { dim: boolean; entrance?: Entrance }>(
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
        .column[data-entrance] .fill {
          animation: grow 900ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
          animation-delay: calc(var(--i) * 24ms);
        }
        .column[data-entrance="hold"] .fill { animation-play-state: paused; }
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
  const [stats, setStats] = createSignal(props.initial);
  const [narrow, setNarrow] = createSignal(false);
  const figuresData = createMemo(() => figuresFor(stats()));
  // A phone shows about the last three months, so each week's bar has room.
  const weeks = createMemo(() => (narrow() ? stats().weeks.slice(-13) : stats().weeks));
  onMount(() => {
    const phone = matchMedia("(width < 40rem)");
    const fit = () => {
      setActive(undefined);
      setNarrow(phone.matches);
    };
    fit();
    phone.addEventListener("change", fit);
    onCleanup(() => phone.removeEventListener("change", fit));
  });
  onMount(() => {
    let disposed = false;
    void latestStats().then((fresh) => {
      if (fresh && !disposed) {
        setActive(undefined);
        setStats(fresh);
      }
    });
    onCleanup(() => {
      disposed = true;
    });
  });
  const [active, setActive] = createSignal<number>();
  const [figuresInView, setFiguresInView] = createSignal(true);
  const [grow, setGrow] = createSignal<Entrance>();
  const isActive = createSelector(active);
  const scrubbing = createMemo(() => active() !== undefined);
  const latest = () => weeks()[weeks().length - 1];
  const week = () => weeks()[active() ?? weeks().length - 1];
  const x = () => `${((active()! + 0.5) / weeks().length) * 100}%`;
  const top = () => nice(0, Math.max(...weeks().map((week) => week.downloads)), 4).max;
  let figures!: HTMLUListElement;
  let readout!: HTMLSpanElement;
  let plot!: HTMLDivElement;
  let startDate!: HTMLSpanElement;
  let endDate!: HTMLSpanElement;
  let pickedDate!: HTMLSpanElement;

  // Under the sticky header counts as out of view, and scroll-padding-top covers the header.
  onMount(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const observer = new IntersectionObserver(
      (entries) => setFiguresInView(entries.at(-1)!.isIntersecting),
      {
        rootMargin: `${-header}px 0px 0px`,
      },
    );
    observer.observe(figures);
    onCleanup(() => observer.disconnect());
  });

  onMount(() => entrance(plot, setGrow));
  onMount(() => swell(readout));

  // An end date steps aside only when the picked week's date comes within an em of it.
  const [crowded, setCrowded] = createSignal({ start: false, end: false });
  createEffect(
    on([active, weeks], ([index]) => {
      if (index === undefined) return setCrowded({ start: false, end: false });
      const picked = pickedDate.getBoundingClientRect();
      const room = parseFloat(getComputedStyle(pickedDate).fontSize);
      const near = (date: Element) => {
        const { left, right } = date.getBoundingClientRect();
        return left < picked.right + room && picked.left < right + room;
      };
      setCrowded({ start: near(startDate), end: near(endDate) });
    }),
  );

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
        <Index each={figuresData()}>
          {(figure) => {
            const [countUp, setCountUp] = createSignal<Entrance>();
            const digits = () => places(figure().value);
            let count!: HTMLSpanElement;
            onMount(() => {
              entrance(count, setCountUp);
              swell(count);
            });

            return (
              <li>
                <span
                  ref={count}
                  class={`${styles.count} swell`}
                  style={{ "--n": figure().value }}
                  data-entrance={countUp()}
                  aria-hidden="true"
                >
                  <Index each={digits()}>
                    {(place, k) => (
                      <span
                        class={styles.digit}
                        classList={{ [styles.lead]: place() > 1 }}
                        data-i={k}
                        style={{ "--i": k, "--place": place() }}
                      />
                    )}
                  </Index>
                  <Show when={figure().suffix}>
                    <span data-i={digits().length} style={{ "--i": digits().length }}>
                      {figure().suffix}
                    </span>
                  </Show>
                </span>
                <span class="visually-hidden">{figure().exact}</span>
                <span class={styles.what}>{figure().label}</span>
              </li>
            );
          }}
        </Index>
        <li>
          <span class={`${styles.readout} swell`} ref={readout}>
            <span class="visually-hidden">{formatNumber(week().downloads)}</span>
            <span aria-hidden="true">
              <Index each={[...formatNumber(week().downloads)]}>
                {(character, i) => (
                  <span data-i={i} style={{ "--i": i }}>
                    {character()}
                  </span>
                )}
              </Index>
            </span>
          </span>
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
          scale={[0, top()]}
          ticks={false}
          aspect={2.8}
          theme={theme}
          label="Weekly downloads of my packages on PyPI and npm"
        >
          <Plot
            rows={weeks()}
            dim={(d: Row<Week>) => scrubbing() && !isActive(d.index)}
            entrance={grow}
            keyboard
          >
            {Column}
          </Plot>
        </Chart>
        <Show when={scrubbing() && !figuresInView()}>
          <span
            class={styles.tip}
            style={{ "--x": x(), "--y": `${(week().downloads / top()) * 100}%` }}
            aria-hidden="true"
          >
            {formatNumber(week().downloads)}
          </span>
        </Show>
      </div>
      <div class={styles.axis} aria-hidden="true">
        <span ref={startDate} class={styles.end} data-hidden={crowded().start ? "" : undefined}>
          {formatDay(weeks()[0].start)}
        </span>
        <span ref={endDate} class={styles.end} data-hidden={crowded().end ? "" : undefined}>
          {formatDay(latest().start)}
        </span>
        <Show when={scrubbing()}>
          <span ref={pickedDate} class={styles.picked} style={{ "--x": x() }}>
            {formatDay(week().start)}
          </span>
        </Show>
      </div>
    </div>
  );
}
