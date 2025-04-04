import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    hmr: {
      port: 5000
    },
    allowedHosts: [
      'localhost',
      '938f0a92-0904-4996-8d4e-8f16175430cb-00-2s65egchpvfx2.picard.replit.dev'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  }
});