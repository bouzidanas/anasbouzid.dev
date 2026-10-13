import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Chart, Plot, Poster, Scale } from "@bezda/rhp";
import { RestSlat, SampleSlat } from "./gallery/stem-plot/chart.jsx";
import * as styles from "./gallery/stem-plot/styles.js";
import "../../lib/rhp";

const ring = (pitch: number, decay: number) =>
  Array.from({ length: 36 }, (_, k) => Math.cos(k * pitch) * Math.exp(-k / decay));

// The gallery's bell, shortened for a card, striking itself every few seconds while it's on screen.
export default function BellCard() {
  const [y, setY] = createSignal(ring(0.6094, 11.776));
  const [visible, setVisible] = createSignal(false);
  let box!: HTMLDivElement;

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(box);
    onCleanup(() => observer.disconnect());
  });

  createEffect(() => {
    if (!visible()) return;
    const timer = setInterval(
      () => setY(ring(0.45 + Math.random() * 0.35, 9 + Math.random() * 9)),
      3200,
    );
    onCleanup(() => clearInterval(timer));
  });

  return (
    <div class="bell-card" ref={box} aria-hidden="true">
      <Poster look="sound" kicker="One strike · 36 samples" title="The sound of a bell">
        <Chart orientation="vertical" scale={[-1.05, 1.05]} height={170} theme={styles.theme}>
          <Scale ticks={[0]}>{RestSlat}</Scale>
          <Plot y={y()}>{SampleSlat}</Plot>
        </Chart>
      </Poster>
    </div>
  );
}
