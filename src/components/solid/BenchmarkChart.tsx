import { Bar, Chart, Label, Plot, slat } from "@bezda/rhp";
import { updates, type Result } from "../../data/benchmark";
import { theme } from "../../lib/rhp";

const Row = slat<Result & { mine: boolean }>(
  {
    thickness: 26,
    room: { start: "auto", end: 64 },
    css: `
      .bar { --rhp-radius: 2px; }
      .name { color: var(--rhp-muted); }
      .mine .name { color: var(--rhp-ink); font-weight: 600; }
      .value { font-variant-numeric: tabular-nums; }
    `,
  },
  (d) => (
    <div class={d.mine ? "mine" : undefined}>
      <Label edge="start" class="name">
        {d.library}
      </Label>
      <Bar to={d.latency} color={d.mine ? "series-1" : "series-3"} class="bar" />
      <Label at={d.latency} class="value">
        {d.latency < 10 ? d.latency.toFixed(1) : d.latency} ms
      </Label>
    </div>
  ),
);

// Drawn on the server only: the data never changes, so the page needs no script for it.
export default function BenchmarkChart() {
  return (
    <Chart
      static
      scale={[0, 25]}
      ticks={[0, 10, 20]}
      format={(value) => `${value} ms`}
      theme={theme}
      label="Milliseconds from a data change to the new frame, by chart library. Lower is faster."
    >
      <Plot rows={updates} mine={(d: Result) => d.library.startsWith("rhp")}>
        {Row}
      </Plot>
    </Chart>
  );
}
