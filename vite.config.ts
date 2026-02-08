import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // AC2/AC3: Manual chunks for better code splitting
        manualChunks: {
          // React core - needed everywhere
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase - loaded with auth
          'supabase-vendor': ['@supabase/supabase-js'],
          // TanStack Query - loaded after auth
          'query-vendor': ['@tanstack/react-query'],
          // UI libraries - loaded on first page that needs them
          'ui-vendor': ['react-hook-form', '@hookform/resolvers', 'zod', 'lucide-react'],
          // Tiptap rich text editor - only loaded in admin forms
          'tiptap-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-underline', '@tiptap/extension-link'],
        },
      },
    },
    // Don't warn for chunks up to 600KB (vendor chunks may be larger)
    chunkSizeWarningLimit: 600,
  },
})
