# テストツール導入

方針の詳細は [testing-strategy.md](../../architecture/decisions/testing-strategy.md) を参照。

## 1. Vitest（共通セットアップ）

- [x] 1. `vitest`・`@vitejs/plugin-react`・`@testing-library/react`・`@testing-library/dom`・`vite-tsconfig-paths`・`msw` を devDependencies に追加
- [x] 2. `apps/web/vitest.config.ts` を`projects`機能で作成し、`schema`（node）・`server`（node）・`hooks`（jsdom）の3プロジェクトに分割（[testing-strategy.mdのVitestの実行環境構成](../../architecture/decisions/testing-strategy.md#vitestの実行環境構成projects機能)参照）
- [x] 3. `package.json` に `test` スクリプトを追加（ルートにも `"test": "turbo run test"` を追加済み）
- [x] 4. `packages/common/src/__tests__/error-message.test.ts` を作成して動作確認（メッセージ生成関数5件。[testing-strategy.mdの記述規約](../../architecture/decisions/testing-strategy.md)の最初の適用例）
- [x] 5. 既存のzodスキーマに対するサンプルテストを1つ作成して動作確認（`schema`プロジェクト。`features/profile-setup/schema/__tests__/profileSetupFormSchema.test.ts` として作成、16テスト。schema層の記述パターンは[testing-strategy.md](../../architecture/decisions/testing-strategy.md)参照）
- [x] 6. `globals: true` へ切り替え（2026-07-19。`apps/web`・`packages/common`両方のvitest.config + tsconfigの`vitest/globals`。経緯は[testing-strategy.mdの記述規約](../../architecture/decisions/testing-strategy.md)参照）

## 2. Vitest（結合テスト: server/routes）

- [ ] 1. `server/lib/db.ts` を `isProd` 分岐に変更（本番=Turso、それ以外=`DATABASE_URL`環境変数 or `file:./local.db`）
- [ ] 2. `server`プロジェクトのセットアップファイルで `process.env.DATABASE_URL = ':memory:'` を設定
- [ ] 3. `drizzle-orm/libsql/migrator` の `migrate()` で `packages/db/migrations` を適用する処理を `beforeEach` に作成（テストケースごとにDBを作り直す。[DB分離方針](../../architecture/decisions/testing-strategy.md#結合テストのdb分離テストケース単位)参照）
- [ ] 4. `vi.mock('@clerk/hono')` で `clerkMiddleware`・`getAuth` をモックするユーティリティを作成（`vi.hoisted()`でテストごとに`userId`を切り替え可能にする。[Clerk認証モック方針](../../architecture/decisions/testing-strategy.md#結合テストのclerk認証モック)参照）
- [ ] 5. Honoの `app.request()` を使い、`server/routes/profile/handler.ts` に対する結合テストを1つ作成

## 3. Vitest（フックテスト: features/\*/hooks/）

- [x] 1. `hooks`プロジェクトのセットアップファイルでMSWの`setupServer()`・`server.listen()`を設定（`apps/web/vitest.setup.hooks.ts`。ファイル構成は[testing-strategy.mdのMSWセットアップのファイル構成](../../architecture/decisions/testing-strategy.md#フックテストのmswモック方針)参照）
- [x] 2. orval生成の`get{Feature}Mock()`をグローバルハンドラとして登録（`apps/web/mocks/handlers.ts` に集約し、セットアップファイルから参照）
- [x] 3. `features/profile-setup/hooks/useProfileSetupForm.ts` に対するテストを作成（2xx/400/その他のステータス分岐を検証。異常系は`server.use()`で個別の生ハンドラを記述）
  - [x] 204成功ケース（`useProfileSetupForm.test.tsx`。`.tsx`のため`include`を`{ts,tsx}`化し`@vitejs/plugin-react`をvitest.configに追加）
  - [x] 異常系3ケース（400・その他ステータス・ネットワークエラー。2026-07-19完了）
  - [x] リクエストボディ変換の検証・バリデーションエラー時の送信ガード（計6テスト。記述パターンは[testing-strategy.md](../../architecture/decisions/testing-strategy.md)の「hooks層テストの記述パターン」参照）
- [x] 4. `clearMocks: true` を `apps/web/vitest.config.ts` に追加（2026-07-19。モック履歴のテスト間分離。[testing-strategy.md](../../architecture/decisions/testing-strategy.md)参照）

## 4. Playwright（E2E）

- [x] 1. `@playwright/test` を手動インストール（`bun add -d @playwright/test` + `bunx playwright install`）
- [x] 2. `apps/web/playwright.config.ts` を作成
- [x] 3. CIワークフローを作成（`playwright.yml` → `ci.yml` にリネームして統合。E2Eステップはテスト0件のためコメントアウト中。[dev-workflow.md](../../architecture/decisions/dev-workflow.md)参照）
- [ ] 4. `playwright.config.ts` の `webServer.port` を devサーバーの実ポート3001に修正（`baseURL`は修正済み）
- [ ] 5. サインイン・ダッシュボードを含む主要フローが一通り繋がってから着手する（[testing-strategy.md](../../architecture/decisions/testing-strategy.md#e2eテスト対象フロー一覧)参照）
- [ ] 6. `apps/web/e2e/onboarding.spec.ts`（ゴールデンパス1本目）を作成
- [ ] 7. GitHub Secrets に Clerk のキー類を登録し、`ci.yml` のE2Eステップを再有効化する

## 5. CIへの組み込み

- [x] 1. `.github/workflows/ci.yml` で lint → 型チェック → Vitest単体テストを実行（2026-07-12導入。実行順の理由は[dev-workflow.md](../../architecture/decisions/dev-workflow.md)参照）
- [ ] 2. build ステップの追加を検討
