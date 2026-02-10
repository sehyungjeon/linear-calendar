import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/calendar/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'date-holidays': ['date-holidays'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
