export const theme = {
  font: "system-ui, sans-serif",
  ink: "#f4f1ff",
  muted: "#8f89a8",
  grid: "#2a2638",
  surface: "#0e0c14",
};

// A sample: a gradient stem and a glowing tip, fading with time.
export const sample = `
.swing, .tip { transition-delay: calc(var(--k) * 8ms); }
.swing { --rhp-radius: 99px; opacity: var(--fade); }
.swing { background: linear-gradient(var(--rhp-toward-end), #6d28d9, #ec4899); }
.tip { background: #fff; opacity: var(--fade); box-shadow: 0 0 10px 2px rgb(236 72 153 / .7); }
`;

// The resting line.
export const rest = `
.rest { background: var(--rhp-grid); --rhp-tick-width: 1px; }
`;
