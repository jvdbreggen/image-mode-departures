import { defineConfig } from 'vite';
import os from 'os';

const hostname = os.hostname();
const domain = hostname.split('.').slice(1).join('.');

export default defineConfig({
  cacheDir: '/var/app/departures/.vite',
  server: {
    port: 5174,
    host: true,
    allowedHosts: domain ? [hostname, `.${domain}`] : [hostname],
    proxy: {
      '/api': `http://${process.env.API_HOST || 'localhost'}:3001`,
    },
  },
});
