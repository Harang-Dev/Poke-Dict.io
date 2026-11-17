import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { siteUrl } from './scripts/site-config.mjs';

export default defineConfig({
  base: siteUrl.pathname,
  define: { __POKEDICT_SITE_URL__: JSON.stringify(siteUrl.href) },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
});
