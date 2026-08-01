import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0', // Expose to network for Docker access
    port: 5173,
    allowedHosts: ['srv1255200.tail6d6468.ts.net'],
    proxy: {
      '/komik': {
        target: process.env.VITE_API_URL || 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
});
