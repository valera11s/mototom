import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
  })],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './'),
      },
      {
        find: '@/components',
        replacement: path.resolve(__dirname, './Components'),
      },
      {
        find: '@/lib',
        replacement: path.resolve(__dirname, './src/lib'),
      },
      {
        find: '@/api',
        replacement: path.resolve(__dirname, './src/api'),
      },
      {
        find: '@/utils',
        replacement: path.resolve(__dirname, './src/utils'),
      },
    ],
    extensions: ['.js', '.jsx', '.json'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

