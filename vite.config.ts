import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3006,
      host: '0.0.0.0',
      proxy: {
        '/api/deepseek': {
          target: 'https://openrouter.ai/api/v1',
          changeOrigin: true,
          secure: true, // OpenRouter SSL should work, but safe to leave false if needed. Let's try true or remove secure arg to default.
          rewrite: (path) => path.replace(/^\/api\/deepseek/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
