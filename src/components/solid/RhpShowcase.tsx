import { createEffect, createSignal, For, onCleanup, Show, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import AiUse from "./gallery/linked-views/chart.jsx";
import Bell from "./gallery/stem-plot/chart.jsx";
import "../../lib/rhp";
import styles from "./RhpShowcase.module.css";

interface Entry {
  name: string;
  title: string;
  chart?: Component<{ o: string; js: boolean; seed: number }>;
  page?: string;
}

const entries: Entry[] = [
  { name: "Bell", title: "The sound of a bell", chart: Bell },
  { name: "Dial", title: "Where the average day goes", page: "/rhp/dial.html" },
  { name: "Skyscrapers", title: "The world's tallest buildings", page: "/rhp/silhouettes.html" },
  { name: "Violins", title: "Teenagers sleep longer at weekends", page: "/rhp/violin.html" },
  { name: "AI use", title: "Four in ten use AI to write", chart: AiUse },
  {
    name: "Beeswarm",
    title: "Africa's typical country trails Europe's",
    page: "/rhp/beeswarm.html",
  },
];

interface Target {
  root: Element;
  frame?: HTMLIFrameElement;
}

export default function RhpShowcase() {
  const [picked, setPicked] = createSignal(0);
  const [target, setTarget] = createSignal<Target>();
  const [showWrites, setShowWrites] = createSignal(false);
  const [written, setWritten] = createSignal<{ count: number; total: number }>();
  let stage!: HTMLDivElement;
  let marks!: HTMLDivElement;

  // The recipes are pages of their own, served from this site, so their documents can be read.
  const open = (frame: HTMLIFrameElement) => {
    const body = frame.contentDocument!.body;
    const fit = () => (frame.style.height = `${body.offsetHeight}px`);
    const view = frame.contentWindow as Window & typeof globalThis;
    new view.ResizeObserver(fit).observe(body);
    fit();
    setTarget({ root: body, frame });
  };

  // A Place has no size of its own, so its mark goes around what it holds.
  const bounds = (
    element: Element,
  ): { left: number; top: number; right: number; bottom: number } => {
    const rect = element.getBoundingClientRect();
    if (rect.width || rect.height || !element.children.length) return rect;
    const parts = [...element.children].map(bounds);
    return {
      left: Math.min(...parts.map((part) => part.left)),
      top: Math.min(...parts.map((part) => part.top)),
      right: Math.max(...parts.map((part) => part.right)),
      bottom: Math.max(...parts.map((part) => part.bottom)),
    };
  };

  // Each mark follows its element every frame, so it stays on a bar while it grows or slides.
  const following = new Map<Element, { span: HTMLSpanElement; frame?: HTMLIFrameElement }>();
  let frameId = 0;

  const follow = () => {
    const box = stage.getBoundingClientRect();
    for (const [element, { span, frame }] of following) {
      const rect = bounds(element);
      const origin = frame?.getBoundingClientRect() ?? { left: 0, top: 0 };
      span.style.translate = `${rect.left + origin.left - box.left}px ${rect.top + origin.top - box.top}px`;
      span.style.width = `${rect.right - rect.left}px`;
      span.style.height = `${rect.bottom - rect.top}px`;
    }
    frameId = following.size ? requestAnimationFrame(follow) : 0;
  };

  const mark = (element: Element, frame?: HTMLIFrameElement) => {
    if (following.has(element)) return;
    const span = document.createElement("span");
    span.className = element.parentElement?.classList.contains("rhp-plot")
      ? `${styles.mark} ${styles.row}`
      : styles.mark;
    span.addEventListener("animationend", () => {
      following.delete(element);
      span.remove();
    });
    following.set(element, { span, frame });
    marks.append(span);
    if (!frameId) follow();
  };

  createEffect(() => {
    const current = target();
    if (!showWrites() || !current) return;
    const { root, frame } = current;
    const observer = new MutationObserver((records) => {
      const elements = new Set(
        records.map((record) => record.target as Element).filter((el) => el.closest(".rhp-chart")),
      );
      if (!elements.size) return;
      setWritten({ count: elements.size, total: root.querySelectorAll(".rhp-chart *").length });
      elements.forEach((element) => mark(element, frame));
    });
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["style"] });
    onCleanup(() => {
      observer.disconnect();
      setWritten(undefined);
    });
  });

  const pick = (index: number) => {
    setTarget(undefined);
    setPicked(index);
  };

  return (
    <div class={styles.showcase}>
      <div class={styles.controls}>
        <div class={styles.choices} role="group" aria-label="Pick a chart">
          <For each={entries}>
            {(entry, index) => (
              <button
                type="button"
                aria-pressed={picked() === index()}
                onClick={() => pick(index())}
              >
                {entry.name}
              </button>
            )}
          </For>
        </div>
        <button
          type="button"
          class={`button quiet ${styles.writes}`}
          aria-pressed={showWrites()}
          onClick={() => setShowWrites(!showWrites())}
        >
          Show writes
        </button>
      </div>

      <div class={styles.stage} ref={stage}>
        <Show when={entries[picked()]} keyed>
          {(entry) =>
            entry.chart ? (
              <div class={styles.native} ref={(el) => setTarget({ root: el })}>
                <Dynamic component={entry.chart} o="vertical" js={false} seed={0} />
              </div>
            ) : (
              <iframe
                class={styles.frame}
                src={entry.page}
                title={entry.title}
                onLoad={(event) => open(event.currentTarget)}
              />
            )
          }
        </Show>
        <div class={styles.marks} ref={marks} />
      </div>

      <p class={styles.note}>
        <Show
          when={written()}
          fallback="Every chart here is live. Point at it, click it or tab into it, and turn on Show writes to see what rhp changes."
        >
          {(last) => `The last update wrote to ${last().count} of ${last().total} chart elements.`}
        </Show>
      </p>
    </div>
  );
}
