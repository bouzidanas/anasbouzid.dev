import "@bezda/rhp/rhp.css";
import { linkedCss, type ThemeValues } from "@bezda/rhp";

linkedCss();

export const theme: ThemeValues = {
  series: ["var(--accent)", "var(--ink)", "var(--muted)"],
  ink: "var(--ink)",
  muted: "var(--muted)",
  grid: "var(--rule)",
  surface: "transparent",
  font: "var(--font-mono)",
};
