import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Isso previne que o app feche sozinho no Android ao tentar acessar process.env
  define: {
    'process.env': {}
  }
});
