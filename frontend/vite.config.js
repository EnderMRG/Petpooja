import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/menu': 'http://localhost:8000',
      '/voice': 'http://localhost:8000',
      '/inventory': 'http://localhost:8000',
      '/recipes': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/orders': 'http://localhost:8000',
    }
  }
})
