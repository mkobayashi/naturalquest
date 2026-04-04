// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Cloudflare Pages: 静的アセットは `dist/` をルートにデプロイ（adapter 不要）
export default defineConfig({
  output: 'static',
  site: 'https://naturalquest.org',
  vite: {
    plugins: [tailwindcss()]
  }
});