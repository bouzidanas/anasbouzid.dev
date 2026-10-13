// 7-row pixel letters, top row first.
const glyphs: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

export const ROWS = 7;

export interface Segment {
  from: number;
  to: number;
}

/** A word as columns of vertical segments, measured from the bottom row up, with a blank column between letters. */
export function columns(word: string): Segment[][] {
  const result: Segment[][] = [];

  [...word].forEach((letter, index) => {
    if (index > 0) result.push([]);
    const rows = glyphs[letter];

    for (let x = 0; x < rows[0].length; x++) {
      const segments: Segment[] = [];
      let top: number | undefined;

      for (let y = 0; y <= ROWS; y++) {
        const on = y < ROWS && rows[y][x] === "#";
        if (on && top === undefined) top = y;
        if (!on && top !== undefined) {
          segments.push({ from: ROWS - y, to: ROWS - top });
          top = undefined;
        }
      }
      result.push(segments);
    }
  });

  return result;
}
