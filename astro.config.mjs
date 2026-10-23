import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import AstroPWA from '@vite-pwa/astro';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://innate-economics.pages.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    react(),
    mdx(),
    sitemap(),
    pagefind(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'الاقتصاد الفطري | Explorable Economics',
        short_name: 'الاقتصاد الفطري',
        description: 'شروحات استكشافية تحاكي آليات الاقتصاد والندرة بلغة بصرية وفطرية أصيلة',
        theme_color: '#080c14',
        background_color: '#080c14',
        display: 'standalone',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}']
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
