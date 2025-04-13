// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
    },
  },
});