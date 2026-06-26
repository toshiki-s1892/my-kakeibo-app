# テストツール導入

方針の詳細は [testing-strategy.md](../../architecture/decisions/testing-strategy.md) を参照。

## 1. Vitest（単体テスト）

- [ ] 1. `vitest`・`@vitejs/plugin-react`・`@testing-library/react`・`@testing-library/dom`・`vite-tsconfig-paths` を devDependencies に追加
- [ ] 2. `apps/web/vitest.config.mts` を作成（jsdomまたはhappy-dom環境）
- [ ] 3. `package.json` に `test` スクリプトを追加
- [ ] 4. `packages/common` のロジック、または既存のzodスキーマに対するサンプルテストを1つ作成して動作確認

## 2. Vitest（結合テスト）

- [ ] 1. `server/lib/db.ts` を `isProd` 分岐に変更（本番=Turso、それ以外=`DATABASE_URL`環境変数 or `file:./local.db`）
- [ ] 2. テスト用セットアップファイルで `process.env.DATABASE_URL = ':memory:'` を設定
- [ ] 3. `drizzle-orm/libsql/migrator` の `migrate()` で `packages/db/migrations` を適用する `beforeAll` を作成
- [ ] 4. `vi.mock('@/server/lib/db')` でテスト用DBに差し替えるユーティリティを作成
- [ ] 5. Honoの `app.request()` を使い、`server/routes/profile/handler.ts` に対する結合テストを1つ作成

## 3. Playwright（E2E）

- [ ] 1. プロフィールセットアップ画面のデザイン修正が完了してから着手する
- [ ] 2. `playwright.config.ts` を作成
- [ ] 3. ゴールデンパス1本（サインイン→プロフィールセットアップ→ダッシュボード遷移）のシナリオを作成

## 4. Lefthook・CIへの組み込み

- [ ] 1. [dev-tooling.md](./dev-tooling.md) のLefthook設定にVitest単体テストを追加
