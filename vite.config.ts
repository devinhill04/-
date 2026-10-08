import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), svgr()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Локально /api/news проксируется на публичное превью канала IF News
      // (в проде то же самое делает nginx, см. Dockerfile)
      proxy: {
        // Страница котировок InvestFuture: в блоке «Популярные» внизу — цены всех шести котировок
        // Календари InvestFuture: фильтры (?from=&to=&type=&page=) передаются как есть
        '/api/if-calendar/bonds': {
          target: 'https://investfuture.ru',
          changeOrigin: true,
          rewrite: (path: string) => path.replace('/api/if-calendar/bonds', '/calendar/bonds'),
        },
        '/api/if-calendar/key-rate': {
          target: 'https://investfuture.ru',
          changeOrigin: true,
          rewrite: () => '/calendar/key-rate',
        },
        '/api/if-quotes': {
          target: 'https://investfuture.ru',
          changeOrigin: true,
          rewrite: () => '/quotes/currency-cb-usd',
        },
        '/api/news': {
          target: 'https://t.me',
          changeOrigin: true,
          rewrite: () => '/s/if_market_news',
        },
      },
    },
  };
});
