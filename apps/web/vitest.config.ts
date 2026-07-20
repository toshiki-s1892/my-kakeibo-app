import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, // vite-tsconfig-pathsプラグイン不要
  },
  test: {
    globals: true, // describe/test/expect/viをimportなしで使えるようにする（tsconfigの"vitest/globals"とセット）
    passWithNoTests: true, // テストファイルが0件でもエラーにしない
    clearMocks: true, // 各テスト前に全モックの呼び出し履歴をクリアする
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/routes/**/__tests__/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.server.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'hooks',
          environment: 'jsdom',
          include: ['features/*/hooks/__tests__/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.hooks.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'schema',
          environment: 'node',
          include: ['features/*/schema/__tests__/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
