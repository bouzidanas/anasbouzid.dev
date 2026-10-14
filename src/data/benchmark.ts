// From rhp's benchmark: one value changes in a bar chart, timed until its new frame is drawn.
// Chromium 153 (headless) on an Apple M5, October 5, 2026.
export const benchmarkUrl =
  "https://github.com/bezda-team/rhp/blob/master/bench/RESULTS-MACOS-M5-20261005.md";

export interface Result {
  library: string;
  latency: number;
}

export const updates: Result[] = [
  { library: "rhp (JS)", latency: 1.2 },
  { library: "Plain DOM", latency: 1.4 },
  { library: "Charts.css", latency: 1.9 },
  { library: "Vega-Lite", latency: 2.0 },
  { library: "rhp (CSS)", latency: 2.4 },
  { library: "D3", latency: 2.8 },
  { library: "rhp (static)", latency: 4.9 },
  { library: "Observable Plot", latency: 5.2 },
  { library: "Highcharts", latency: 7.6 },
  { library: "Victory", latency: 8.4 },
  { library: "Nivo", latency: 9.5 },
  { library: "Recharts", latency: 12 },
  { library: "ECharts", latency: 16 },
  { library: "ApexCharts", latency: 16 },
  { library: "Chart.js", latency: 16 },
  { library: "AntV G2", latency: 23 },
];
