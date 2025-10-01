import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      ignored: [
        '**/BACKUPS/**',
        '**/backup.log',
        '**/backup_*.log',
        'backup.log',
        'backup_*.log',
        '**/.git/**',
        '**/node_modules/**',
        '**/sunzi-cerebro-backups/**',
        '**/session-exports/**',
        '**/*.backup',
        '**/*.bak',
        '**/.claude-session-backup/**',
        '**/logs/**',
        '**/*.log',
        '**/temp/**',
        '**/tmp/**'
      ],
      usePolling: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})