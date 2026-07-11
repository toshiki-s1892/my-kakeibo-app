import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true, // テストファイルが0件でもエラーにしない
    environment: 'node',
    include: ['src/__tests__/*.test.ts'],
  },
});
