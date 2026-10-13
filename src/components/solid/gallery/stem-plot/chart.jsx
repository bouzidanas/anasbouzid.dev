import { createSignal, createMemo } from "solid-js";
import { Plot, Scale, Chart, Bar, Dot, Tick, Poster, slat } from "@bezda/rhp";
import "@bezda/rhp/posters.css"; // the posters' looks
import * as styles from "./styles.js";

const rand = (a, b) => a + Math.random() * (b - a);

// One sample: a stem from rest, glowing at its tip, fading as the ring dies away (--fade). A strike reaches the
// samples 8 ms apart (--k), as a transition delay; the JS version moves them all at once.
export const SampleSlat = slat(
  {
    thickness: { horizontal: 12 },
    room: { start: 12, end: 12 },
    css: styles.sample,
  },
  (d) => (
    <div style={{ "--fade": 1 - d.index / 46, "--k": d.index }}>
      <Bar to={d.y} thick="4px" class="swing" />
      <Dot at={d.y} size="7px" class="tip" />
    </div>
  ),
);

// The resting line, the only scale a waveform needs.
export const RestSlat = slat({ css: styles.rest }, () => <Tick at={0} thick={1} class="rest" />);

export default function Stem(p) {
  const [strikes, setStrikes] = createSignal(0); // each strike rings with a new pitch and decay
  const y = createMemo(() => {
    const count = strikes(); // Keep every strike tracked, even after New data makes p.seed nonzero.
    const [w, decay] = p.seed || count ? [rand(0.45, 0.8), rand(9, 18)] : [0.6094, 11.776];
    return Array.from({ length: 36 }, (_, k) => Math.cos(k * w) * Math.exp(-k / decay));
  });
  const strike = () => setStrikes(strikes() + 1);
  return (
    <Poster
      look="sound"
      kicker="One strike · 36 samples"
      title="The sound of a bell"
      dek="Each swing is smaller than the last, until the note dies away. Click the wave to strike the bell again."
    >
      <div
        class="strike"
        role="button"
        tabindex="0"
        aria-label="Strike the bell again"
        onClick={strike}
        style={{ "-webkit-tap-highlight-color": "transparent" }}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), strike())}
      >
        <Chart
          orientation={p.o}
          scale={[-1.05, 1.05]}
          height={280}
          animate={p.js}
          theme={styles.theme}
        >
          <Scale ticks={[0]}>{RestSlat}</Scale>
          <Plot y={y()}>{SampleSlat}</Plot>
        </Chart>
      </div>
    </Poster>
  );
}
