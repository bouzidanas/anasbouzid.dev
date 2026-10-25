import assert from "node:assert/strict";
import test from "node:test";
import { downloadsInLast30Days } from "./stats-periods.mjs";

test("30 calendar days exclude older rows when zero-download days are omitted", () => {
  const days = Array.from({ length: 31 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 15 + i)).toISOString().slice(0, 10),
    downloads: i === 0 ? 7 : 1,
  })).filter(({ date }) => date !== "2026-10-04");

  assert.equal(days.length, 30);
  assert.equal(downloadsInLast30Days(days, "2026-10-15"), 29);
});

test("sources use the same reporting window and exclude newer days", () => {
  assert.equal(
    downloadsInLast30Days(
      [
        { date: "2026-09-15", downloads: 100 },
        { date: "2026-09-16", downloads: 2 },
        { date: "2026-10-15", downloads: 3 },
        { date: "2026-10-16", downloads: 100 },
      ],
      "2026-10-15",
    ),
    5,
  );
});
