import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import {defineConfig} from 'vite';
import {execSync} from 'node:child_process';

// Короткий номер коммита: из параметра сборки (в контейнере нет .git), иначе из git (локально)
const gitHash = () => {
  try { return execSync('git rev-parse --short HEAD', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); } catch { return ''; }
};

// API котировок InvestFuture локально — по тем же адресам, что в проде (там это делает nginx, см. Dockerfile).
// Токен берётся из переменной окружения QUOTES_API_TOKEN и подставляется сервером разработки: в браузер и в
// сборку он не попадает (Vite отдаёт в браузер только переменные с префиксом VITE_). Без переменной маршруты
// отвечают 503 token_not_configured — как в проде, и приложение берёт запасные источники.
//   PowerShell:  $env:QUOTES_API_TOKEN = "<токен>"; npm run dev
const IFQ_BASE = process.env.IFQ_API_BASE || 'https://investfuture.ru';
const ifqToken = process.env.QUOTES_API_TOKEN || '';
const ifqRoute = (universe: string) => ({
  target: IFQ_BASE,
  changeOrigin: true,
  rewrite: () => `/api/v1/market-snapshot?universe=${universe}`, // параметры из браузера не передаются
  headers: { Authorization: `Bearer ${ifqToken}`, Cookie: '' },
});
const ifqNoToken = () => ({
  name: 'ifq-no-token',
  configureServer(server: any) {
    if (ifqToken) return;
    server.middlewares.use((req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api/ifq/')) return next();
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
      res.end('{"error":"token_not_configured"}');
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), svgr(), ifqNoToken()],
    // Версия сборки для экрана диагностики
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __COMMIT__: JSON.stringify(process.env.VITE_COMMIT || process.env.CI_COMMIT_SHORT_SHA || gitHash()),
    },
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
        ...(ifqToken ? { '/api/ifq/overview': ifqRoute('overview'), '/api/ifq/top40': ifqRoute('moex-top40') } : {}),
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
        '/api/news': {
          target: 'https://t.me',
          changeOrigin: true,
          rewrite: () => '/s/if_market_news',
        },
      },
    },
  };
});
