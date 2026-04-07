import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const webPort = parseInt(env.VITE_PORT || '5173', 10);
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@nextride/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    server: {
      port: webPort,
      host: env.VITE_HOST || 'localhost',
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: apiUrl.replace(/^http/, 'ws'),
          ws: true,
        },
      },
    },
  };
});
