import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:4000', changeOrigin: true },
      '/user': { target: 'http://localhost:4000', changeOrigin: true },
      '/upload-sample': { target: 'http://localhost:4000', changeOrigin: true },
      '/generate-resume': { target: 'http://localhost:4000', changeOrigin: true },
      '/history': { target: 'http://localhost:4000', changeOrigin: true },
      '/resumes': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
