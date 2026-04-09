// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { rehypeNaturalquestHttps } from './src/plugins/rehype-naturalquest-https.mjs';

// https://astro.build/config
// Cloudflare Pages: 静的アセットは `dist/` をルートにデプロイ（adapter 不要）
export default defineConfig({
  output: 'static',
  site: 'https://naturalquest.org',
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [rehypeNaturalquestHttps],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});

server: {
  allowedHosts: ['unstridulating-hemizygous-samara.ngrok-free.dev']
  }
  