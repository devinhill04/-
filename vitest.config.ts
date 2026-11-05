import { defineConfig } from 'vitest/config';

// Автотесты критичной логики: `npm test`. Запускаются и в пайплайне GitLab (задача check-app) — до сборки образа,
// так что поломка видна до выкладки. Плагины сборки здесь не нужны, поэтому отдельный конфиг.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  define: { __BUILD_TIME__: JSON.stringify('2026-11-05T09:00:00.000Z'), __COMMIT__: JSON.stringify('test') },
});
