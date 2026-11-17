import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Poke-Dict.io/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
});
