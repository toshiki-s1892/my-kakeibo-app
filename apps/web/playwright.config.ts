import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',
  // 並列実行の設定
  fullyParallel: true,
  // test.only() のコミット混入を防ぐ
  forbidOnly: !!process.env.CI,
  // CI環境のみ制限（ローカルはデフォルト）
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // テスト結果をHTMLレポートとして出力する
  reporter: 'html',
  // 全てのテストに適用される共通設定
  use: {
    // テスト時のベースURL（page.goto('/') で localhost:3000/ に遷移する）
    baseURL: 'http://localhost:3000',
    // 失敗時のデバッグ用（CI）
    trace: 'on-first-retry',
    // 失敗時のスクリーンショットを保存
    screenshot: 'only-on-failure',
    // 再試行時に動画を録画
    video: 'on-first-retry',
    // 日付・金額表示をテスト環境で固定する
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  },
  // テスト対象ブラウザ
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  // テスト中に開発用Webサーバーを起動する設定
  webServer: {
    // 起動するシェルコマンド
    command: 'bun run dev',
    // 起動するWebサーバーのポート番号
    port: 3000,
    // ローカルは起動済みサーバーを再利用、CIは毎回新規起動
    reuseExistingServer: !process.env.CI,
  },
});
