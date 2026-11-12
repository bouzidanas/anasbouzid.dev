// The characters near the pointer get bolder (.swell in global.css), from two numbers this sets on the element:
// --tx, where the bump is, counted in characters, and --lens, how strong it is, from 0 to 1. Both ease toward the
// pointer every frame, so the bump glides between pointer events instead of stepping, and it fades in and out where
// the pointer enters and leaves. Fraunces widens as it gets bolder, so a character's box grows only 70% as much as
// its glyph: the rest of the word moves less, and neighbors in bold still don't run into each other.
const EASE = 120;
const WAVE = 1500;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export function swell(element: HTMLElement) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let rest: { i: number; center: number; width: number }[] = [];
  let target = { at: 0, lens: 0 };
  let now = { at: 0, lens: 0 };
  let wave: { start: number; from: number; to: number } | undefined;
  let inside = false;
  let frame = 0;
  let last = 0;

  // At rest. Each character's width at rest and in bold goes to CSS, which grows its box only part of the way.
  // A digit still hidden by the count-up has no width yet, so it keeps its natural one.
  const measure = () => {
    const characters = [...element.querySelectorAll<HTMLElement>("[data-i]")];
    const size = parseFloat(getComputedStyle(element).fontSize);
    const left = element.getBoundingClientRect().left;
    characters.forEach((character) => {
      character.style.removeProperty("--rest");
      character.style.removeProperty("--bold");
    });
    const boxes = characters.map((character) => character.getBoundingClientRect());
    characters.forEach((character) => (character.style.fontWeight = "700"));
    const bold = characters.map((character) => character.getBoundingClientRect().width);
    characters.forEach((character) => (character.style.fontWeight = ""));

    rest = [];
    characters.forEach((character, k) => {
      if (!boxes[k].width) return;
      character.style.setProperty("--rest", `${boxes[k].width / size}em`);
      character.style.setProperty("--bold", `${bold[k] / size}em`);
      rest.push({
        i: Number(character.dataset.i),
        center: boxes[k].left + boxes[k].width / 2 - left,
        width: boxes[k].width,
      });
    });
  };

  // Between the rest centers of the characters either side of x, and past them at the ends.
  const position = (clientX: number) => {
    const x = clientX - element.getBoundingClientRect().left;
    let k = 0;
    while (k < rest.length - 2 && x > rest[k + 1].center) k++;
    const [a, b] = [rest[k], rest[k + 1]];
    return b
      ? a.i + ((x - a.center) / (b.center - a.center)) * (b.i - a.i)
      : a.i + (x - a.center) / a.width;
  };

  const write = () => {
    element.style.setProperty("--tx", String(now.at));
    element.style.setProperty("--lens", String(now.lens));
  };

  const step = (time: number) => {
    if (wave) {
      const t = Math.min(1, (time - wave.start) / WAVE);
      now = target = { at: wave.from + (wave.to - wave.from) * easeInOut(t), lens: t < 1 ? 1 : 0 };
      if (t === 1) wave = undefined;
    } else {
      const k = 1 - Math.exp(-(time - last) / EASE);
      now = {
        at: now.at + (target.at - now.at) * k,
        lens: now.lens + (target.lens - now.lens) * k,
      };
      if (Math.abs(target.at - now.at) < 0.001 && Math.abs(target.lens - now.lens) < 0.001)
        now = target;
    }
    last = time;
    write();
    frame = wave || now !== target ? requestAnimationFrame(step) : 0;
  };

  const run = () => {
    if (reduce.matches) {
      now = target;
      write();
    } else if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  element.addEventListener("pointerenter", () => {
    inside = true;
    if (now.lens < 0.01) measure();
  });

  element.addEventListener("pointermove", (event) => {
    if (!rest.length) measure();
    wave = undefined;
    target = { at: position(event.clientX), lens: 1 };
    // A bump that has faded out starts where the pointer is, rather than sliding over from where it was.
    if (now.lens < 0.01) now = { at: target.at, lens: now.lens };
    run();
  });

  element.addEventListener("pointerleave", () => {
    inside = false;
    target = { at: target.at, lens: 0 };
    run();
  });

  // A bump that runs once across all the characters, unless the pointer is already on them.
  return {
    wave() {
      if (reduce.matches || inside) return;
      if (now.lens < 0.01) measure();
      wave = { start: performance.now(), from: -3, to: rest.length + 2 };
      run();
    },
  };
}
