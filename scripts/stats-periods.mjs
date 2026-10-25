const DAY = 24 * 60 * 60 * 1000;

export function downloadsInLast30Days(days, end) {
  const start = new Date(Date.parse(end) - 29 * DAY).toISOString().slice(0, 10);
  return days
    .filter(({ date }) => date >= start && date <= end)
    .reduce((total, { downloads }) => total + downloads, 0);
}
