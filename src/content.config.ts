import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "*.mdx" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      order: z.number(),
      years: z.string(),
      role: z.string(),
      stack: z.array(z.string()),
      links: z.array(z.object({ label: z.string(), href: z.url() })),
      poster: image().optional(),
      video: z.string().optional(),
      embed: z.string().optional(),
      embedDark: z.string().optional(),
    }),
});

export const collections = { projects };
