import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    chapterNumber: z.number(),
    description: z.string(),
    concepts: z.array(z.string()),
  }),
});

export const collections = { chapters };
