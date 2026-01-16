import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Aumenta o limite do aviso para 1000kb (1mb) para não poluir o terminal
    chunkSizeWarningLimit: 1000, 
    
    // 2. Configuração Profissional: Divide as bibliotecas em arquivos separados
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Se o arquivo vier da pasta node_modules (bibliotecas), cria um arquivo separado
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
})