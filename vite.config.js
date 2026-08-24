import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '/var/app/departures/.vite',
  server: {
    host: true,
    port: 5174,
    allowedHosts: 'all',
    proxy: {
      '/api': `http://${process.env.API_HOST || 'localhost'}:3001`,
    },
  },
});
