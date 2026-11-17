import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Poke-Dict.io/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
