import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE_PATH controls the asset base URL:
//   - Docker (unified image): set to "/" via Dockerfile ENV so assets load from root
//   - GitHub Pages: set to "/ai-reskilling-think-tank/" via the Pages build workflow
//   - Local dev (vite dev server): defaults to "/" automatically
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/ai-reskilling-think-tank/',
})
