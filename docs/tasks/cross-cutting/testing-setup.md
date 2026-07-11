# テストツール導入

方針の詳細は [testing-strategy.md](../../architecture/decisions/testing-strategy.md) を参照。

## 1. Vitest（共通セットアップ）

- [x] 1. `vitest`・`@vitejs/plugin-react`・`@testing-library/react`・`@testing-library/dom`・`vite-tsconfig-paths`・`msw` を devDependencies に追加
- [x] 2. `apps/web/vitest.config.ts` を`projects`機能で作成し、`schema`（node）・`server`（node）・`hooks`（jsdom）の3プロジェクトに分割（[testing-strategy.mdのVitestの実行環境構成](../../architecture/decisions/testing-strategy.md#vitestの実行環境構成projects機能)参照）
- [x] 3. `package.json` に `test` スクリプトを追加
- [ ] 4. 既存のzodスキーマに対するサンプルテストを1つ作成して動作確認（`schema`プロジェクト）

## 2. Vitest（結合テスト: server/routes）

- [ ] 1. `server/lib/db.ts` を `isProd` 分岐に変更（本番=Turso、それ以外=`DATABASE_URL`環境変数 or `file:./local.db`）
- [ ] 2. `server`プロジェクトのセットアップファイルで `process.env.DATABASE_URL = ':memory:'` を設定
- [ ] 3. `drizzle-orm/libsql/migrator` の `migrate()` で `packages/db/migrations` を適用する処理を `beforeEach` に作成（テストケースごとにDBを作り直す。[DB分離方針](../../architecture/decisions/testing-strategy.md#結合テストのdb分離テストケース単位)参照）
- [ ] 4. `vi.mock('@clerk/hono')` で `clerkMiddleware`・`getAuth` をモックするユーティリティを作成（`vi.hoisted()`でテストごとに`userId`を切り替え可能にする。[Clerk認証モック方針](../../architecture/decisions/testing-strategy.md#結合テストのclerk認証モック)参照）
- [ ] 5. Honoの `app.request()` を使い、`server/routes/profile/handler.ts` に対する結合テストを1つ作成

## 3. Vitest（フックテスト: features/\*/hooks/）

- [ ] 1. `hooks`プロジェクトのセットアップファイルでMSWの`setupServer()`・`server.listen()`を設定
- [ ] 2. orval生成の`get{Feature}Mock()`をグローバルハンドラとして登録（成功パスのデフォルト動作）
- [ ] 3. `features/profile-setup/hooks/useProfileSetupForm.ts` に対するテストを作成（2xx/400/その他のステータス分岐を検証。異常系は`server.use()`で個別の生ハンドラを記述）

## 4. Playwright（E2E）

- [x] 1. `@playwright/test` を手動インストール（`bun add -d @playwright/test` + `bunx playwright install`）
- [x] 2. `apps/web/playwright.config.ts` を作成
- [x] 3. `.github/workflows/playwright.yml` を作成（Bun・モノレポ対応版）
- [ ] 4. サインイン・ダッシュボードを含む主要フローが一通り繋がってから着手する（[testing-strategy.md](../../architecture/decisions/testing-strategy.md#e2eテスト対象フロー一覧)参照）
- [ ] 5. `apps/web/e2e/onboarding.spec.ts`（ゴールデンパス1本目）を作成

## 5. CIへの組み込み

- [ ] 1. [dev-tooling.md](./dev-tooling.md) のCI設定にVitest単体テストが含まれていることを確認
