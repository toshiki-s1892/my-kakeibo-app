# セキュリティ強化（ヘッダー・CVE対策・ログ）

方針の詳細は [security.md](../../architecture/decisions/security.md) の該当セクションを参照。

## バックエンド

- [ ] 1. `server/shared/error-handler.ts`のログ出力を、`error`オブジェクト全体ではなく`message`・`stack`のみに変更する（[security.mdのエラーログにリクエストの生値を含めない](../../architecture/decisions/security.md#エラーログにリクエストの生値を含めない2026-08-23決定)参照）
- [ ] 2. `apps/web/proxy.ts`の`clerkMiddleware`に`contentSecurityPolicy`オプション（`frame-ancestors: 'none'`）を追加する
- [ ] 3. `apps/web/next.config.ts`に`headers()`を追加し、`X-Content-Type-Options`・`Strict-Transport-Security`・`X-Frame-Options`・`Referrer-Policy`を設定する（値は[security.mdの表](../../architecture/decisions/security.md#セキュリティヘッダー2026-08-23決定)参照）
- [ ] 4. `.github/workflows/ci.yml`に`bun audit`ステップを追加する（依存パッケージの既存脆弱性が残っている間は`|| true`で非ブロッキング運用）
- [ ] 5. `bun update`等で既存の既知脆弱性（`bun audit`実行時点で58件、Highが本番依存の`@libsql/client`経由`ws`を含む）を解消する
- [ ] 6. 5が完了したら、4の`bun audit`から`|| true`を外しブロッキングに戻す
- [ ] 7. GitHubリポジトリ設定（Code security）でDependabot Alertsを有効化する（設定ファイル不要）
- [ ] 8. Upstash Redisアカウントを作成し、環境変数（接続URL・トークン）を追加する
- [ ] 9. `server/lib/rate-limit.ts`にUpstash Redis + `hono-rate-limiter`のアダプタを実装し、認証済みエンドポイント全体にユーザー単位の緩めの上限を適用する（[api-conventions.mdのAPIのレート制限](../../architecture/decisions/api-conventions.md#apiのレート制限2026-08-23決定)参照）
- [ ] 10. AIエンドポイント（レシート読み取り・アドバイス）に、既存の日次上限とは別にユーザー単位の短時間バースト制限を追加する
- [ ] 11. JSON系エンドポイントにHonoの`bodyLimit`ミドルウェアで上限（例: 100KB）を設定する（[api-conventions.mdのリクエストボディサイズの上限](../../architecture/decisions/api-conventions.md#リクエストボディサイズの上限2026-08-23決定)参照）
- [ ] 12. Tursoトークンを対象データベース1つにスコープし、有効期限90日で再発行する（[security.mdのTursoトークンの運用方針](../../architecture/decisions/security.md#tursoトークンの運用方針2026-08-23決定)参照）。Vercelの環境変数を更新
- [ ] 13. `.github/workflows/ci.yml`（または別ワークフロー）に`gitleaks/gitleaks-action`を追加し、シークレットの誤コミットを検知する
- [ ] 14. レシート読み取り機能（[ai.md](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)）実装時、`server/lib/`にマジックバイト検証関数を実装し、Gemini送信前に実際の画像形式か確認する
- [ ] 15. Google AI Studio（またはGoogle Cloud Console）でGeminiのAPIキーを「Generative Language APIのみ」に制限する
- [ ] 16. Google Cloudの予算アラート（Budgets & alerts）とQuota（APIs & Services > Quotas）の両方を設定する（予算アラートだけでは呼び出しは止まらない点に注意）
- [ ] 17. Tursoの`turso db create new-db --from-db <db> --timestamp ...`による復元を一度実際に試し、復元後の接続先切り替え手順を確認する
- [ ] 18. レシート読み取り機能実装時、Geminiが抽出した商品名（→メモ欄）に手入力メモと同じ最大長・エスケープ処理を適用し、Gemini出力だからと検証をスキップしないようにする（[security.mdのプロンプトインジェクション対策](../../architecture/decisions/security.md#プロンプトインジェクション対策2026-08-23決定)参照）
- [ ] 19. Vercelダッシュボードで環境変数（`TURSO_AUTH_TOKEN`・`TURSO_CONNECTION_URL`・Gemini APIキー・Clerkシークレットキー）をProduction/Preview/Developmentで分離し、Preview用に本番とは別のTurso DB・低予算のGemini APIキーを用意する。機密値は「Sensitive」フラグを付ける（[security.mdのVercel環境変数のスコープ分離](../../architecture/decisions/security.md#vercel環境変数のスコープ分離2026-08-23決定)参照）

## フロントエンド

- [ ] 1. （フロントエンド実装なし）

## クリーンアップ

- [ ] 1. （未定）

## 将来検討（今回はスコープ外）

- Dependabot version updates または Renovate による依存パッケージの自動更新PR導入
