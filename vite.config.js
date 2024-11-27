import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    },
    fs: {
      strict: true
    },
    middlewareMode: false
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  build: {
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});