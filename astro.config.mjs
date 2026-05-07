// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { rehypeNaturalquestHttps } from './src/plugins/rehype-naturalquest-https.mjs';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://naturalquest.org',
  integrations: [mdx(), react(), sitemap()],

  markdown: {
    rehypePlugins: [rehypeNaturalquestHttps],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    allowedHosts: ['unstridulating-hemizygous-samara.ngrok-free.dev'],
  },
  // adapter: cloudflare() ← 削除
});