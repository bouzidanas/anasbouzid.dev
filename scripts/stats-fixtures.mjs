const DAY = 86400000;
export const days = Array.from({ length: 180 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 3, 19) + i * DAY).toISOString().slice(0, 10),
  downloads: 1,
}));

export function upstream(url) {
  if (url.includes("api.github.com")) return Response.json({ stargazers_count: 100 });
  if (url.includes("pypistats.org")) {
    return Response.json({ data: days.map((row) => ({ ...row, category: "without_mirrors" })) });
  }
  return Response.json({
    downloads: days.map(({ date, downloads }) => ({ day: date, downloads })),
  });
}
