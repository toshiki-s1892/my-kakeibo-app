import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // vite-tsconfig-pathsプラグイン不要
  },
  test: {
    passWithNoTests: true, // テストファイルが0件でもエラーにしない
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/routes/**/__tests__/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'hooks',
          environment: 'jsdom',
          include: ['features/*/hooks/__tests__/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'schema',
          environment: 'node',
          include: ['features/*/schema/__tests__/*.test.ts'],
        },
      },
    ],
  },
});
