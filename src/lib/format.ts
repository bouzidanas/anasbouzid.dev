const number = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export const formatNumber = (value: number) => number.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatDay = (date: string) => day.format(new Date(date));
export const formatDate = (value: Date) => date.format(value);
