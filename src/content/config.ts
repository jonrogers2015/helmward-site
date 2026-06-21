import { defineCollection, z } from 'astro:content';

// Blog content collection. The Agent OS content pipeline publishes by writing a markdown
// file into src/content/blog/<slug>.md with this frontmatter, committing, and pushing —
// Cloudflare Pages rebuilds and deploys automatically.
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Helmward'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
