// The hero's interactive quiz, and the "how it works" timeline. The data
// and the reasoning for it are in lecture.js.

import { DURATION, MARKS, FINAL, CHAPTERS, INTERVALS, BLOCK_TITLES, INTRO, OUTRO, QUESTIONS, STORE_URL, clock, cardClock, chapterAt, pct, readTime, timeFor, pairMarks, arcPath, OPTION_ORDERS } from './lecture.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const esc = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const play = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5v9l7.5-4.5z"/></svg>';

function initDemo(root) {
  const $ = sel => root.querySelector(sel);
  const frame = $('.frame'), cc = $('.cc'), card = () => $('.card');
  const quiz = $('.quiz'), back = $('.back-pill'), pp = $('.pp'), tag = $('.ev-tag');
  const now = $('[data-now]'), chapter = $('[data-chapter]');
  const seek = $('.seek');

  const frames = {
    board: ['/quizmark/assets/media/frame-board-800.webp 800w, /quizmark/assets/media/frame-board.webp 1600w', '/quizmark/assets/media/frame-board.webp', 'A lecturer at a chalkboard with Git snapshots, blobs and a commit graph drawn on it.'],
    talk: ['/quizmark/assets/media/frame-talk-800.webp 800w, /quizmark/assets/media/frame-talk.webp 1600w', '/quizmark/assets/media/frame-talk.webp', 'The lecturer speaking at the front of the lecture hall, beside a projected comic.'],
  };
  // Warm the second frame so the first Watch swaps instantly.
  new Image().srcset = frames.talk[0];

  // Seek bar: chapter segments, the four quiz marks and the final test.
  const track = $('.seek-track');
  track.innerHTML = CHAPTERS.map(([start], i) => {
    const end = CHAPTERS[i + 1]?.[0] ?? DURATION;
    return `<i style="flex:${end - start}"></i>`;
  }).join('');
  track.classList.add('has-chapters');
  // Only the first quiz exists in the demo. The others are drawn the way the
  // extension draws quizzes it is still writing questions for.
  const marks = [
    ...MARKS.map((at, i) => ({ start: i ? MARKS[i - 1] : 0, at, title: `Quiz ${i + 1} — ${BLOCK_TITLES[i]}`, ready: i === 0, go: 'Go to quiz' })),
    { start: 0, at: FINAL, title: 'Final test', ready: false, go: 'Open final test', final: true },
  ];
  const markBox = $('.seek-marks');
  markBox.innerHTML = marks.map((m, i) =>
    `<button class="mark ${m.ready ? 'is-ready' : 'is-generating'}${m.final ? ' is-final' : ''}" type="button" style="--x:${pct(m.at)}" aria-label="${esc(m.title)}. ${m.ready ? 'Ready' : 'Generating'}" aria-controls="demo-tip" aria-expanded="false"></button>`).join('');
  const markEls = [...markBox.children];

  // The hover card, in the extension's layout: title, state and the stretch
  // it covers, and its button. Only the ready quiz's button does anything.
  const tip = $('.tip');
  let openMark = null, closeTimer;
  function openTip(i) {
    clearTimeout(closeTimer);
    const m = marks[i];
    tip.innerHTML = `<p class="tip-title">${esc(m.title)}</p>
      <p class="tip-state"><span>${m.ready ? 'Ready' : 'Generating…'}</span><span class="tip-range">${cardClock(m.start)}–${cardClock(m.at)}</span></p>
      <button class="tip-go" type="button" data-act="tip" ${m.ready ? '' : 'disabled'}>${m.go}</button>`;
    const box = $('.stage').getBoundingClientRect(), dot = markEls[i].getBoundingClientRect(), bar = seek.getBoundingClientRect();
    tip.style.setProperty('--left', `${dot.left + dot.width / 2 - box.left}px`);
    tip.style.bottom = `${box.bottom - bar.top + 4}px`;
    tip.hidden = false;
    markEls.forEach((el, k) => el.setAttribute('aria-expanded', String(k === i)));
    openMark = i;
  }
  function closeTip() {
    clearTimeout(closeTimer);
    tip.hidden = true;
    markEls.forEach(el => el.setAttribute('aria-expanded', 'false'));
    openMark = null;
  }
  const scheduleClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(closeTip, 220); };
  markEls.forEach((el, i) => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') openTip(i); });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') scheduleClose(); });
    el.addEventListener('focus', () => openTip(i));
    el.addEventListener('blur', e => { if (!tip.contains(e.relatedTarget)) scheduleClose(); });
    // Touch has no hover: a tap opens the card, a second tap closes it.
    el.addEventListener('click', () => (openMark === i && !matchMedia('(hover: hover)').matches ? closeTip() : openTip(i)));
  });
  tip.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  tip.addEventListener('pointerleave', scheduleClose);
  tip.addEventListener('focusout', e => { if (!tip.contains(e.relatedTarget) && !markBox.contains(e.relatedTarget)) scheduleClose(); });

  const s = { t: MARKS[0], q: 0, picked: null, results: [], submitted: false, view: 'prelude', layout: 0 };
  // Where question i's keyed answer is shown this attempt, as 0–3 for A–D.
  const order = i => OPTION_ORDERS[s.layout][i];
  const slotOf = i => order(i).indexOf(QUESTIONS[i].answer);
  let run = null; // the one running playback, if any

  const setTime = t => {
    s.t = t;
    seek.style.setProperty('--p', pct(t));
    now.textContent = clock(t);
    chapter.textContent = chapterAt(t);
  };
  const setCaption = text => { cc.innerHTML = text ? `<span>${esc(text)}</span>` : ''; };
  const setFrame = name => {
    const [srcset, src, alt] = frames[name];
    if (frame.getAttribute('src') === src) return;
    frame.classList.add('is-swapping');
    setTimeout(() => {
      frame.srcset = srcset; frame.src = src; frame.alt = alt;
      frame.classList.remove('is-swapping');
    }, reduceMotion.matches ? 0 : 160);
  };
  const setState = state => {
    root.dataset.state = state;
    const quizUp = ['prelude', 'question', 'summary', 'end'].includes(state);
    quiz.inert = !quizUp;
    pp.disabled = quizUp;
    markEls.forEach(el => { el.tabIndex = quizUp ? -1 : 0; });
    if (quizUp) closeTip();
    pp.setAttribute('aria-label', root.classList.contains('is-playing') ? 'Pause the demo' : 'Play the demo');
  };
  const playing = on => {
    root.classList.toggle('is-playing', on);
    pp.setAttribute('aria-label', on ? 'Pause the demo' : 'Play the demo');
  };

  // Plays a stretch of the lecture: the playhead moves at a compressed pace
  // and each caption appears at its own timestamp.
  function playRange({ from, to, lines, seconds, paced }, done) {
    stop();
    const times = paced
      ? lines.reduce((acc, [, text], i) => [...acc, (acc[i] ?? 0) + readTime(text)], [0])
      : null;
    const total = paced ? times.at(-1) : seconds * 1000;
    const at = elapsed => paced
      ? (() => {
          const i = Math.min(lines.length - 1, times.findIndex((x, k) => elapsed < times[k + 1]));
          const a = lines[i][0], b = lines[i + 1]?.[0] ?? to;
          const f = Math.min(1, (elapsed - times[i]) / (times[i + 1] - times[i]));
          return a + (b - a) * f;
        })()
      : from + (to - from) * Math.min(1, elapsed / total);
    let start = performance.now(), paused = 0, pausedAt = null, raf;
    const tick = () => {
      const elapsed = performance.now() - start - paused;
      const t = elapsed >= total ? to : at(elapsed);
      setTime(t);
      const line = [...lines].reverse().find(([when]) => when <= t + 0.01);
      setCaption(line ? line[1] : '');
      if (elapsed >= total) { run = null; playing(false); done?.(); return; }
      raf = requestAnimationFrame(tick);
    };
    run = {
      stop() { cancelAnimationFrame(raf); run = null; playing(false); },
      toggle() {
        if (pausedAt === null) { pausedAt = performance.now(); cancelAnimationFrame(raf); playing(false); }
        else { paused += performance.now() - pausedAt; pausedAt = null; playing(true); raf = requestAnimationFrame(tick); }
      },
    };
    setTime(from);
    playing(true);
    raf = requestAnimationFrame(tick);
  }
  function stop() { run?.stop(); }

  // ---- Views ----

  const show = (html, { focus = true } = {}) => {
    quiz.innerHTML = html;
    const c = card();
    if (!reduceMotion.matches) c.classList.add('is-entering');
    if (focus) c.querySelector('[data-focus]')?.focus({ preventScroll: true });
  };
  const dots = () => `<div class="dots" aria-hidden="true">${QUESTIONS.map((_, i) =>
    `<i class="${s.results[i] === true ? 'ok' : s.results[i] === false ? 'no' : i === s.q ? 'on' : ''}"></i>`).join('')}</div>`;

  function prelude(focus) {
    setState('prelude');
    show(`<div class="card" data-view="prelude">
      <p class="q-kicker">Quiz 1 of 4</p>
      <h2 class="q-title" tabindex="-1" data-focus>Introduction → Data model, as pseudocode</h2>
      <p class="q-desc">How Git represents snapshots of code as trees and blobs, and how commits form a history graph.</p>
      <dl class="q-stats"><div><dt>Questions</dt><dd>${QUESTIONS.length}</dd></div><div><dt>Difficulty</dt><dd>Medium</dd></div><div><dt>Covers</dt><dd>0:00–15:28</dd></div></dl>
      <div class="q-row q-center"><button class="pill pill-blue" type="button" data-act="start">Start</button><button class="pill" type="button" data-act="skipquiz">Skip this quiz</button></div>
    </div>`, { focus });
  }

  function question(focus = true) {
    const q = QUESTIONS[s.q];
    const done = s.submitted;
    const right = s.picked === slotOf(s.q);
    setState('question');
    show(`<div class="card" data-view="question">
      <p class="q-kicker">Question ${s.q + 1} of ${QUESTIONS.length} <span class="chip">${esc(q.topic)}</span></p>
      <p class="q-text" id="q-text" tabindex="-1" ${done ? '' : 'data-focus'}>${esc(q.text)}</p>
      <div class="opts" role="radiogroup" aria-labelledby="q-text">${order(s.q).map(k => q.options[k]).map((o, i) => {
        const cls = done ? (i === slotOf(s.q) ? 'is-right' : i === s.picked ? 'is-wrong' : '') : '';
        return `<button class="opt ${cls}" type="button" role="radio" aria-checked="${s.picked === i}" data-opt="${i}" ${done ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`;
      }).join('')}</div>
      ${done ? `<p class="verdict ${right ? 'ok' : 'no'}" tabindex="-1" data-focus>${right ? 'Correct' : 'Not quite'}</p><p class="explain">${esc(q.explain)}</p>` : ''}
      <div class="q-row">
        <button class="pill" type="button" data-act="watch">${play}${done ? 'Rewatch' : 'Watch'}</button>
        ${done ? '' : '<button class="pill" type="button" data-act="skip">Skip</button>'}
        <span class="spacer"></span>
        ${done
          ? `<button class="pill pill-green" type="button" data-act="next">${s.q + 1 < QUESTIONS.length ? 'Next question' : 'See results'}</button>`
          : `<button class="pill pill-blue" type="button" data-act="submit" ${s.picked === null ? 'disabled' : ''}>Submit</button>`}
      </div>
      ${dots()}
    </div>`, { focus });
  }

  function summary() {
    const score = s.results.filter(Boolean).length;
    setState('summary');
    show(`<div class="card" data-view="summary">
      <p class="q-kicker">Quiz 1 of 4 complete</p>
      <p class="score" tabindex="-1" data-focus>${score} of ${QUESTIONS.length}</p>
      <p class="muted">The next quiz opens at 32:07. The final test at the end of the video brings these questions back.</p>
      <div class="q-row"><button class="pill pill-blue" type="button" data-act="continue">Keep watching</button><button class="pill" type="button" data-act="retake">Retake</button></div>
      ${dots()}
    </div>`);
  }

  function ending() {
    setState('end');
    show(`<div class="card" data-view="end">
      <p class="q-title" tabindex="-1" data-focus>That’s the whole idea.</p>
      <p class="muted">Quizmark does this across any YouTube video with captions, every 15 minutes or so, with questions written for that video.</p>
      <div class="q-row"><a class="pill pill-light" href="${STORE_URL}">Add to Chrome, it’s free</a><button class="pill" type="button" data-act="replay">Replay the demo</button></div>
    </div>`);
  }

  function watch() {
    const q = QUESTIONS[s.q];
    setState('evidence');
    setFrame(q.frame);
    seek.style.setProperty('--a', pct(q.span[0]));
    seek.style.setProperty('--w', pct(q.span[1] - q.span[0]));
    seek.querySelector('.seek-span').style.opacity = '1';
    back.hidden = false;
    back.classList.remove('is-ready');
    tag.innerHTML = `Source for question ${s.q + 1}<span>${clock(q.span[0])}–${clock(q.span[1])}</span>`;
    tag.hidden = false;
    back.focus({ preventScroll: true });
    playRange({ from: q.span[0], to: q.span[1], lines: q.lines, paced: true }, () => back.classList.add('is-ready'));
  }

  // Returning from the passage restores the quiz exactly, and the playhead to
  // where the quiz opened: the viewer's place is kept.
  function backToQuiz() {
    stop();
    back.hidden = true;
    tag.hidden = true;
    seek.querySelector('.seek-span').style.opacity = '0';
    setFrame('board');
    setTime(MARKS[0]);
    setCaption('Any questions so far?');
    question();
  }

  function intro() {
    stop();
    s.q = 0; s.picked = null; s.results = []; s.submitted = false;
    quiz.innerHTML = '';
    setState('playing');
    setFrame('board');
    playRange(INTRO, () => smooth(() => prelude(false)));
  }

  function keepWatching() {
    quiz.innerHTML = '';
    setState('playing');
    playRange(OUTRO, () => smooth(ending));
  }

  // "Go to quiz" opens the quiz where the viewer left it. From a passage
  // being replayed, that is the same as Back to quiz.
  function goToQuiz() {
    closeTip();
    if (root.dataset.state === 'evidence') return backToQuiz();
    stop();
    if (s.results.length || s.submitted || s.picked !== null) question();
    else prelude(true);
  }

  // ---- Input ----

  // On a narrow player the quiz sets the player's height, so each view
  // changes it. Measure before and after a change and animate between the
  // two rather than letting the player snap to its new size, and scroll the
  // page as it goes so the player's centre stays where it was on screen: the
  // change spreads up and down from the demo instead of only downward.
  // Height and scroll are set in the same frame, so the centre never drifts;
  // the scroll is instant because the page otherwise smooth-scrolls.
  // The page scrolls only once the visitor has chosen Start or Skip this
  // quiz, and only while at least half the player is on screen. The first
  // quiz opens by itself, and moving the page then would shift it under
  // someone still reading the hero.
  const stage = root.querySelector('.stage');
  let engaged = false;
  const inView = r => Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= r.height / 2;
  const RESIZE_MS = 400;
  const easeOut = t => 1 - (1 - t) ** 3;
  let resizeRaf;
  function smooth(change) {
    if (stage.clientWidth >= 560 || reduceMotion.matches) return change();
    cancelAnimationFrame(resizeRaf);
    const from = stage.getBoundingClientRect();
    change();
    stage.style.height = '';
    const to = stage.getBoundingClientRect().height;
    if (Math.abs(to - from.height) < 1) return;
    const centre = from.top + from.height / 2;
    const follow = engaged && inView(from);
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / RESIZE_MS);
      stage.style.height = `${from.height + (to - from.height) * easeOut(t)}px`;
      const r = stage.getBoundingClientRect();
      const drift = r.top + r.height / 2 - centre;
      if (follow && Math.abs(drift) >= 0.5) window.scrollBy({ top: drift, behavior: 'instant' });
      if (t < 1) resizeRaf = requestAnimationFrame(step);
      else stage.style.height = '';
    };
    stage.style.height = `${from.height}px`;
    resizeRaf = requestAnimationFrame(step);
  }

  root.addEventListener('click', event => smooth(() => onClick(event)));
  function onClick(event) {
    const opt = event.target.closest('[data-opt]');
    if (opt && !s.submitted) { pick(Number(opt.dataset.opt)); return; }
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'start' || act === 'skipquiz') engaged = true;
    if (act === 'start') { s.q = 0; question(); }
    else if (act === 'skipquiz') keepWatching();
    else if (act === 'tip') goToQuiz();
    else if (act === 'watch') watch();
    else if (act === 'back') backToQuiz();
    else if (act === 'skip') { s.results[s.q] = null; advance(); }
    else if (act === 'submit' && s.picked !== null) { s.submitted = true; s.results[s.q] = s.picked === slotOf(s.q); question(); }
    else if (act === 'next') advance();
    else if (act === 'continue') keepWatching();
    else if (act === 'retake') { s.q = 0; s.picked = null; s.results = []; s.submitted = false; s.layout = 1 - s.layout; question(); }
    else if (act === 'replay') intro();
    else if (act === 'toggle') {
      if (run) run.toggle();
      else if (root.dataset.state === 'idle') intro();
    }
  }
  // Choosing an answer updates the card in place. Re-rendering it replayed
  // the card's entrance animation, so it flashed on every choice.
  function pick(i) {
    s.picked = i;
    const c = card();
    c.querySelectorAll('[data-opt]').forEach(el => el.setAttribute('aria-checked', String(Number(el.dataset.opt) === i)));
    c.querySelector('[data-act="submit"]').disabled = false;
    c.querySelector(`[data-opt="${i}"]`).focus();
  }

  function advance() {
    s.picked = null; s.submitted = false;
    if (s.q + 1 < QUESTIONS.length) { s.q += 1; question(); } else summary();
  }

  // The extension's own shortcuts: 1–4 choose, Enter submits. Esc closes an
  // open hover card.
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openMark !== null) { const i = openMark; closeTip(); markEls[i].focus(); return; }
    if (root.dataset.state !== 'question' || s.submitted) return;
    const n = Number(event.key);
    if (n >= 1 && n <= 4) { event.preventDefault(); pick(n - 1); }
    else if (event.key === 'Enter' && s.picked !== null && !event.target.closest('[data-act]')) {
      event.preventDefault(); card().querySelector('[data-act="submit"]').click();
    }
  });

  // The page is written in its resting state: the quiz already open at 15:28.
  // With motion allowed, rewind to 12:05 and let the lecture play up to the
  // mark the first time the player is on screen.
  setTime(MARKS[0]);
  seek.querySelector('.seek-span').style.opacity = '0';
  if (reduceMotion.matches || !('IntersectionObserver' in window)) { prelude(false); return; }
  setState('idle');
  quiz.innerHTML = '';
  setTime(INTRO.from);
  setCaption('So there we go.');
  const seen = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    seen.disconnect();
    setTimeout(() => { if (root.dataset.state === 'idle') intro(); }, 700);
  }, { threshold: 0.6 });
  seen.observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden && run && root.dataset.state === 'playing') run.toggle(); });
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const MOVE_MS = 750;
const FILL_MS = 2600;
// Once the fill has run, the timeline steps through the other intervals and
// back, one every few seconds while it is on screen: the interval is the
// viewer's choice, and each mark moves to that video's nearest break. Marks
// two intervals share (chapter changes both snap to) stay where they are.
const CYCLE = [15, 10, 20, 30];
const HOLD_MS = 5000;
// The first change follows one beat after the fill settles rather than a full hold later, so a
// reader who scrolls on after a few seconds has already seen the marks move once.
const FIRST_HOLD_MS = 900;

function initTimeline(root) {
  const section = root.closest('section');
  const bar = root.querySelector('.tl-bar');
  bar.innerHTML = CHAPTERS.map(([start], i) => `<i style="flex:${(CHAPTERS[i + 1]?.[0] ?? DURATION) - start}"></i>`).join('');
  bar.classList.add('has-chapters');
  const box = root.querySelector('.tl-marks'), labels = root.querySelector('.tl-labels');
  const arc = root.querySelector('.tl-arc path');
  const count = section.querySelector('[data-count]');
  const firstTc = section.querySelector('[data-first-mark]');

  // One dot and one label per boundary time, reused while the time stays.
  labels.querySelectorAll('.is-mark').forEach(el => el.remove());
  box.innerHTML = '';
  const els = new Map();
  const add = t => {
    const dot = document.createElement('span'), label = document.createElement('span');
    dot.style.setProperty('--x', pct(t));
    label.className = 'is-mark';
    label.style.setProperty('--x', pct(t));
    label.textContent = clock(t);
    box.append(dot); labels.append(label);
    const pair = { dot, label };
    els.set(t, pair);
    return pair;
  };
  let minutes = 15;
  INTERVALS[minutes].forEach(add);
  const final = document.createElement('span');
  final.className = 'is-final';
  final.style.setProperty('--x', pct(FINAL));
  box.append(final);
  const markFirst = () => {
    labels.querySelectorAll('.is-first').forEach(el => el.classList.remove('is-first'));
    els.get(INTERVALS[minutes][0]).label.classList.add('is-first');
  };
  markFirst();

  // The arc follows the first quiz's rendered position every frame while it
  // moves, so it stays attached whatever the easing.
  let arcRaf;
  const followArc = ms => {
    cancelAnimationFrame(arcRaf);
    const end = performance.now() + ms;
    const step = () => {
      const r = root.getBoundingClientRect(), m = els.get(INTERVALS[minutes][0]).dot.getBoundingClientRect();
      if (r.width) arc.setAttribute('d', arcPath(((m.left + m.width / 2 - r.left) / r.width) * 1000));
      if (performance.now() < end) arcRaf = requestAnimationFrame(step);
    };
    step();
  };
  followArc(0);
  addEventListener('resize', () => followArc(0));

  const retext = (el, text) => {
    if (el.textContent === text) return;
    el.textContent = text;
    if (!reduceMotion.matches) el.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(.2em)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
  };

  function choose(next) {
    const { keep, slides, enter, exit } = pairMarks(INTERVALS[minutes], INTERVALS[next]);
    const moved = new Map(keep.map(t => [t, els.get(t)]));
    for (const [from, to] of slides) {
      const pair = els.get(from);
      pair.dot.style.setProperty('--x', pct(to));
      pair.label.style.setProperty('--x', pct(to));
      pair.label.textContent = clock(to);
      moved.set(to, pair);
    }
    for (const t of exit) {
      const { dot, label } = els.get(t);
      dot.classList.add('is-out'); label.classList.add('is-out');
      setTimeout(() => { dot.remove(); label.remove(); }, MOVE_MS);
    }
    for (const t of enter) {
      const pair = add(t);
      box.append(final);
      pair.dot.classList.add('is-hit', 'is-out'); pair.label.classList.add('is-out');
      requestAnimationFrame(() => requestAnimationFrame(() => { pair.dot.classList.remove('is-out'); pair.label.classList.remove('is-out'); }));
      moved.set(t, pair);
    }
    els.clear();
    for (const t of INTERVALS[next]) els.set(t, moved.get(t));
    minutes = next;
    markFirst();
    followArc(MOVE_MS + 50);
    retext(count, WORDS[INTERVALS[next].length]);
    retext(firstTc, clock(INTERVALS[next][0]));
  }

  const spans = () => [...box.children];
  if (reduceMotion.matches || !('IntersectionObserver' in window)) { spans().forEach(el => el.classList.add('is-hit')); return; }

  root.classList.add('is-waiting');
  root.style.setProperty('--p', '0%');
  let visible = false, cycling = null;
  const tick = () => { if (visible) choose(CYCLE[(CYCLE.indexOf(minutes) + 1) % CYCLE.length]); };
  const seen = new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (!visible || root.classList.contains('is-running')) return;
    root.classList.add('is-running');
    requestAnimationFrame(() => requestAnimationFrame(() => root.style.setProperty('--p', '100%')));
    // The fill eases along cubic-bezier(.45, 0, .25, 1), so each mark lights
    // when the fill actually reaches it rather than at a constant speed.
    [...INTERVALS[minutes], FINAL].forEach((t, i) => setTimeout(() => {
      spans()[i].classList.add('is-hit');
      if (i === 0) root.classList.remove('is-waiting');
    }, FILL_MS * timeFor(t / DURATION)));
    setTimeout(() => { tick(); cycling = setInterval(tick, HOLD_MS); }, FILL_MS + FIRST_HOLD_MS);
  }, { threshold: 0.4 });
  seen.observe(root);
}

const demo = document.getElementById('demo');
if (demo) initDemo(demo);
const timeline = document.querySelector('.timeline');
if (timeline) initTimeline(timeline);
