import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-chessboard'], // Remove @chrisoakman/chessboardjs
    exclude: ['lucide-react'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          chessboard: ['react-chessboard'],
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
    devSourcemap: true,
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
    target: 'es2020',
  },
});