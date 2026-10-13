// The demo lecture: data and pure helpers shared by the hero player and the
// "how it works" timeline. No DOM here, so the tests can import it.
//
// Everything shown comes from the real product run on one lecture: MIT's
// Missing Semester, "Version Control (Git)" (9K8lB61dl3Y). The quiz
// boundaries are the extension's 15-minute blocks, the questions and
// explanations are verbatim from its question bank, and every caption line is
// the lecture's own, at its own timestamp. Only the pace is compressed.

export const DURATION = 4172;

// Block boundaries the extension draws for this lecture at each interval,
// exactly as its segmenter produces them. The last block of every plan is
// absorbed into the final test, so a plan's quizzes are all but its last block.
export const INTERVALS = {
  10: [720.493, 1255.922, 1927.825, 2475.494, 2896.816, 3623.785],
  15: [928.832, 1927.825, 2896.816, 3623.785],
  20: [1255.922, 2317.39, 3623.785],
  30: [1927.825, 3727.825],
};
export const DEFAULT_INTERVAL = 15;
export const MARKS = INTERVALS[DEFAULT_INTERVAL];
// Titles the extension gave the 15-minute blocks; the last is the final test's.
export const BLOCK_TITLES = [
  'Introduction → Data model, as pseudocode',
  'Objects and content-addressing & References',
  'Repositories → Basics',
  'Branching and merging',
  'Remotes & Conclusion',
];
// Where the final test sits: the end of the lecture's content, which the
// extension finds per video. Drawn near the end rather than measured.
export const FINAL = 4150;
export const CHAPTERS = [
  [0, 'Introduction'], [345, 'Git’s data model'], [376, 'Snapshots'],
  [474, 'Modeling history: relating snapshots'], [720, 'Data model, as pseudocode'],
  [931, 'Objects and content-addressing'], [1255, 'References'], [1927, 'Repositories'],
  [2085, 'Staging area'], [2270, 'Git command-line interface'], [2317, 'Basics'],
  [2904, 'Branching and merging'], [3623, 'Remotes'], [3994, 'Conclusion'],
];

// The run-up to the first quiz, 12:05 to 15:28. The lecturer's own pause
// ("Any questions so far?") lands a hair before the block boundary.
export const INTRO = { from: 725, to: MARKS[0], seconds: 6, lines: [
  [733.7, 'Let’s write down a little bit of pseudocode.'],
  [761.9, 'And then we have trees or directories.'],
  [814.7, 'So now we have files and folders, and now we want to model our history.'],
  [859.5, 'So what is a commit?'],
  [894.9, 'Commits refer back to other commits.'],
  [908.3, 'You might want a commit message,'],
  [928.8, 'Any questions so far?'],
] };

// What plays after the quiz, when the viewer keeps watching.
export const OUTRO = { from: MARKS[0], to: 946, seconds: 3.2, lines: [
  [932.0, 'So continuing along in terms of thinking about Git and history and all that…'],
] };

export const QUESTIONS = [
  {
    topic: 'debugging with history tracking',
    text: 'What is one way Git can help identify when a bug was introduced in a codebase?',
    options: ['By comparing different versions of the code', 'By using binary search on the version history', 'By tracking who made each change', 'By displaying a graph of all commits'],
    answer: 1,
    explain: 'The lecturer explains that Git can automatically perform a binary search on the entire version history to pinpoint where a bug was introduced.',
    span: [152, 186], frame: 'talk',
    lines: [
      [152.2, 'Suppose you’ve been working on a particular piece of software for months and months,'],
      [155.6, 'and one day you notice, oh, hey, the software has a particular bug,'],
      [159.0, 'and it looks like this bug wasn’t originally there.'],
      [163.6, 'And then at some point in the last year, you introduced a bug into your code.'],
      [167.2, 'What would you do to try to figure out when that bug was introduced?'],
      [172.0, 'Well, version control systems can automate this for you.'],
      [174.4, 'You can do something really cool where you write a test that fails if your bug is present,'],
      [179.0, 'and then your version control system can automatically binary search your entire version history in order to pinpoint exactly where that bug was introduced.'],
    ],
  },
  {
    topic: 'history model',
    text: 'What term describes the structure of Git’s history, where each snapshot can have multiple parents and is represented as a graph?',
    options: ['Tree', 'DAG', 'Graph', 'Commit Tree'],
    answer: 1,
    explain: 'The segment explicitly states that Git’s history is a directed acyclic graph (DAG) of snapshots.',
    span: [493, 516], frame: 'board',
    lines: [
      [493.4, 'And every one is a snapshot,'],
      [494.9, 'and you can see how things change over time by looking at different snapshots.'],
      [498.8, 'And for a number of reasons, Git doesn’t model history like this.'],
      [501.8, 'And instead, it’s a little bit fancier in Git.'],
      [504.8, 'In Git, a history is a directed acyclic graph of snapshots.'],
      [509.3, 'And if you haven’t taken the data structures and algorithms class, don’t worry,'],
      [512.8, 'we’ll give you good enough intuition for that, and it’s not that complicated.'],
    ],
  },
  {
    topic: 'data model',
    text: 'In the pseudocode example, what does a commit contain besides its snapshot and parents?',
    options: ['A list of file names', 'An author name and commit message', 'SHA-1 hash values', 'A reference to the object store'],
    answer: 1,
    explain: 'The segment explicitly states that commits include an author name and a commit message as part of their data structure.',
    span: [898, 921], frame: 'board',
    lines: [
      [898.7, 'And then there’s some other stuff that goes inside of here, handy things,'],
      [902.0, 'like maybe you want to have an author name.'],
      [908.3, 'You might want a commit message,'],
      [915.6, 'where you might put in things like what changed in a particular commit that you’re introducing in the history graph.'],
    ],
  },
];

export const STORE_URL = 'https://chromewebstore.google.com/detail/quizmark-for-youtube/jgioigmgkjknmokdpinigoafjhacbbpc';

export const clock = seconds => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};
// The extension's hover cards print m:ss only, so an hour reads as 60:23.
export const cardClock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export const chapterAt = t => CHAPTERS.reduce((name, [start, title]) => (t >= start ? title : name), CHAPTERS[0][1]);
export const pct = t => `${(t / DURATION) * 100}%`;
// How long a caption line stays up when a passage is replayed: long enough to
// read, short enough that a visitor is never left waiting on the demo.
export const readTime = text => Math.min(4200, Math.max(1500, text.length * 42));

// Inverse of the CSS curve cubic-bezier(.45, 0, .25, 1): the fraction of the
// duration at which the eased fill reaches a given fraction of the distance.
export function timeFor(progress) {
  const x = m => 3 * m * (1 - m) ** 2 * 0.45 + 3 * m ** 2 * (1 - m) * 0.25 + m ** 3;
  const y = m => 3 * m ** 2 * (1 - m) + m ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (y(m) < progress) lo = m; else hi = m; }
  return x((lo + hi) / 2);
}

// Pair two plans' marks: shared times stay, each new time takes the nearest
// old one that is leaving and slides from there, and any left over appear or
// fade away. Nearest, so a mark never slides across the others.
export function pairMarks(from, to) {
  const keep = to.filter(t => from.includes(t));
  const leaving = from.filter(t => !to.includes(t));
  const arriving = to.filter(t => !from.includes(t));
  const candidates = leaving.flatMap(o => arriving.map(t => [o, t]))
    .filter(([o, t]) => !keep.some(k => (k - o) * (k - t) < 0))
    .sort((x, y) => Math.abs(x[0] - x[1]) - Math.abs(y[0] - y[1]));
  const slides = [];
  for (const [o, t] of candidates) {
    if (!slides.some(([u, v]) => u === o || v === t)) slides.push([o, t]);
  }
  return {
    keep, slides,
    enter: arriving.filter(t => !slides.some(([, v]) => v === t)),
    exit: leaving.filter(o => !slides.some(([u]) => u === o)),
  };
}
// The evidence arc from the first quiz back to the playhead at 2:32, where
// the first question's passage starts, in viewBox units.
export const EVIDENCE_X = (152 / DURATION) * 1000;
export const arcPath = x => {
  const e = EVIDENCE_X, span = x - e;
  return `M${x.toFixed(1)} 96 C ${(x - span * 0.08).toFixed(1)} 8, ${(e + span * 0.1).toFixed(1)} 8, ${e.toFixed(1)} 92`;
};

// Two fixed option orders, as indexes into each question's options, that
// alternate on every run or retake of the quiz, standing in for the
// extension's shuffle. The keyed answers sit at C, A, D in the first and
// A, D, B in the second, so no layout puts them all in one slot and each
// answer moves on a retake.
export const OPTION_ORDERS = [
  [[0, 2, 1, 3], [1, 0, 2, 3], [0, 2, 3, 1]],
  [[1, 3, 0, 2], [2, 0, 3, 1], [3, 1, 0, 2]],
];
