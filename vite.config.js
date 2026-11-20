import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { adsensePublisherId, siteUrl } from './scripts/site-config.mjs';

export default defineConfig({
  base: siteUrl.pathname,
  define: { __POKEDICT_SITE_URL__: JSON.stringify(siteUrl.href) },
  plugins: [react(), tailwindcss(), {
    name: 'adsense-site-verification',
    transformIndexHtml: () => adsensePublisherId ? [{ tag: 'meta', attrs: { name: 'google-adsense-account', content: adsensePublisherId }, injectTo: 'head' }] : [],
  }],
  test: {
    environment: 'jsdom',
  },
});
