import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Removido o bloco resolve.alias pois os arquivos estão na raiz e não em uma pasta src/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // Garante que o process.env exista vazia para evitar crash em libs, 
    // mas idealmente a API Key deve ser injetada pelo ambiente de build
    'process.env': {} 
  }
});
