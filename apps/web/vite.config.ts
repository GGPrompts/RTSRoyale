import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@rts-arena/core': resolve(__dirname, '../../packages/core/src'),
      '@rts-arena/types': resolve(__dirname, '../../packages/types/src'),
      '@rts-arena/client': resolve(__dirname, '../../packages/client/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['pixi.js', 'bitecs'],
  },
});
