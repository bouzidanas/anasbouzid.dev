export interface Contribution {
  project: string;
  summary: string;
  repo: string;
  pulls: number[];
  merged: boolean;
  date: string;
}

// Newest first, dated by the latest merge (or by when the pull request opened, if it's still open).
export const contributions: Contribution[] = [
  {
    project: "HOL Guard",
    summary: "Added PR UI Compare to its extensions as an MCP server",
    repo: "hashgraph-online/hol-guard",
    pulls: [3118],
    merged: true,
    date: "Sep 2026",
  },
  {
    project: "Bento",
    summary:
      "Made the editor's top bar measure its contents instead of using width breakpoints, and fixed the autosave tag, the folded toolbar, the mobile Save button, toast contrast and the spaces gutter",
    repo: "nyblnet/bento",
    pulls: [239, 258, 294, 295, 328],
    merged: true,
    date: "Sep 2026",
  },
  {
    project: "Jupyter nbconvert",
    summary: "Proposed full reveal.js configuration from notebook metadata",
    repo: "jupyter/nbconvert",
    pulls: [2257],
    merged: false,
    date: "Dec 2025",
  },
  {
    project: "react-ace",
    summary: "Fixed the foldStyle option",
    repo: "securingsincity/react-ace",
    pulls: [1804],
    merged: true,
    date: "Mar 2024",
  },
  {
    project: "revealjs.com",
    summary: "Wrote the guide to using reveal.js with React",
    repo: "reveal/revealjs.com",
    pulls: [60],
    merged: true,
    date: "Feb 2024",
  },
  {
    project: "DefinitelyTyped",
    summary: "Added the scroll view options to the reveal.js types",
    repo: "DefinitelyTyped/DefinitelyTyped",
    pulls: [68472],
    merged: true,
    date: "Feb 2024",
  },
  {
    project: "reveal.js",
    summary: "Fixed vertical stack backgrounds in scroll view",
    repo: "hakimel/reveal.js",
    pulls: [3568],
    merged: true,
    date: "Feb 2024",
  },
  {
    project: "Jupyter nbconvert",
    summary:
      "Let notebook cells set data attributes on their slides, for things like background videos",
    repo: "jupyter/nbconvert",
    pulls: [1861],
    merged: true,
    date: "Sep 2022",
  },
];
