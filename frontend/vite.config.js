import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <--- EXPOSES APP TO NETWORK (Allows phone/other laptops to connect)
    port: 5174, // Ensures the port stays consistent
  }
})