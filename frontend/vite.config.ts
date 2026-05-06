import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide') || id.includes('quill')) return 'vendor-ui';
            if (id.includes('mediapipe') || id.includes('generative-ai')) return 'vendor-ai';
            return 'vendor';
          }
        }
      }
    }
  }
})
