import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true, // テストファイルが0件でもエラーにしない
    environment: 'node',
    include: ['src/__tests__/*.test.{ts,tsx}'],
  },
});
