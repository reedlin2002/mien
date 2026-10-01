import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two pages: the site at / and the editor at /editor/. Served from a domain root
// (Cloudflare Pages); set BASE_PATH only when hosting under a sub-path.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
        editor: resolve(import.meta.dirname, 'editor/index.html')
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
