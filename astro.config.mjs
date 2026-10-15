// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  site: "https://anasbouzid.dev",
  integrations: [mdx(), sitemap(), solid()],
  devToolbar: { enabled: false },
  vite: {
    // Lightning CSS folds animation-timeline into the animation shorthand, which browsers reject.
    build: { cssMinify: "esbuild" },
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light-high-contrast", dark: "github-dark" },
      defaultColor: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Fraunces",
      cssVariable: "--font-display",
      weights: ["300 700"],
      styles: ["normal", "italic"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist",
      cssVariable: "--font-sans",
      weights: ["300 700"],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Bricolage Grotesque",
      cssVariable: "--font-poster",
      weights: ["400 800"],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
      weights: ["400 600"],
      styles: ["normal"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
});
