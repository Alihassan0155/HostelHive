import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    hmr: {
      overlay: true, // Show errors as overlay
    },
    watch: {
      usePolling: true, // Fixes Windows file watcher issues
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Enable HMR for React Fast Refresh
  react: {
    fastRefresh: true,
  },
});

