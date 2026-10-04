# セキュリティ強化（ヘッダー・CVE対策・SAST・ログ）

方針の詳細は [security.md](../../architecture/decisions/security.md) の該当セクションを参照。

## バックエンド

- [x] 1. `@hono/structured-logger`を依存関係に追加し、`server/middleware/request-logger.ts`に`requestLogger`（`structuredLogger`の設定。`onResponse`・`onError`の両方でリクエスト完了ログを出す）を実装して、`apps/web/app/api/[...route]/route.ts`で`app.use(requestId())`（`hono/request-id`）の直後に`app.use(requestLogger)`として登録する。完了ログへの`userId`の追加は未実装（[security.mdのログ出力の構造化基盤](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）
- [x] 2. `server/lib/logger.ts`に、`error`・`warn`・`info`の3レベルを持つ`Logger`型（各メソッドは`(fields: Record<string, unknown>, message: string) => void`）と、consoleベースのJSON構造化ロガー`createLogger`を実装する。ロガー生成時に`requestId`・`method`・`path`を全ログ行に付与し、`message`は日本語の固定文言とする。1の`requestLogger`の`createLogger`から呼ぶ（`@hono/structured-logger`のロガー型は制約がないため`BaseLogger`への準拠は不要。pinoは当面導入しない。実装上の決定事項は[security.md](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）
- [x] 3. `server/shared/error-handler.ts`の想定外エラー分岐を`c.var.logger.error()`に置き換える。`error`オブジェクトは渡さず、`DrizzleQueryError`（`message`に`params`の値が入るため）は`query`と`cause.message`のみ（`stack`も出さない。2026-09-26決定。`at`フィルタが改行入りの入力で破られるため。理由は[security.mdのDrizzleのときに`stack`を出さない理由](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）、それ以外の`Error`は`message`・`stack`を出す（[security.md](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）。`cause.message`に値が入らないことはUNIQUE・NOT NULL・CHECK・外部キー・構文エラーで確認済み（ローカルlibsql。Tursoリモートは未実測）。`path`はロガーが全ログ行に付与するので`fields`に足さない。`userId`は`getAuth(c)?.userId`で`fields`に足す。`errorHandler`の引数`c`は`Context`のまま型付けしない（2026-09-26決定。理由は[security.mdのログ出力の構造化基盤](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)の「`errorHandler`の引数`c`は型付けしない」参照）。`structuredLogger`を通らないテスト用アプリでは`c.var.logger`が`undefined`になるため、`categoryListHandler`・`categoryPinHandler`・`profileSetupHandler`の各テストは、共通配線（`requestId()`→`requestLogger`→`onError(errorHandler)`）を済ませた`createTestApp()`（`server/test-utils/createTestApp.ts`。[testing-strategy.md](../../architecture/decisions/testing-strategy.md)の「テスト用appの共通配線」参照）でappを作る（2026-09-26完了）
- [x] 4. `server/shared/error-handler.ts`に、`HTTPException`のステータスが404の場合に`c.var.logger.warn()`でIDOR試行の疑いとして記録する分岐を追加する。`fields`には`event: 'malicious_direct_reference'`（OWASP Logging Vocabularyの語彙。理由はsecurity.md参照）と`userId`（`getAuth(c)?.userId`）を含める（`method`・`path`はロガーが全ログ行に付与済み）。既存の「リクエスト完了」のwarnとは別の行になるが意図的な重複（[security.mdのIDOR対策](../../architecture/decisions/security.md#idor不正な直接オブジェクト参照対策cwe-639)参照）（2026-09-27完了）
- [x] 5. GitHubリポジトリ設定（Code security＞Code scanning）でCodeQLのDefault setupを有効化する（クエリスイートはDefault）。ワークフローファイルの追加は不要（[security.mdのSAST](../../architecture/decisions/security.md#sast静的解析によるコード脆弱性検出2026-09-13決定)参照）
- [x] 6. ブランチ保護ルール（Ruleset）で、CodeQLの検出結果がHigh/Critical severityの場合のみPRマージをブロックするよう設定する（`main`・`develop`両方が対象）
- [ ] 7. `apps/web/proxy.ts`の`clerkMiddleware`に`contentSecurityPolicy`オプション（`frame-ancestors: 'none'`）を追加する
- [ ] 8. `apps/web/next.config.ts`に`headers()`を追加し、`X-Content-Type-Options`・`Strict-Transport-Security`・`X-Frame-Options`・`Referrer-Policy`を設定する（値は[security.mdの表](../../architecture/decisions/security.md#セキュリティヘッダー2026-08-23決定)参照）
- [ ] 9. `.github/workflows/ci.yml`に`bun audit`ステップを追加する（依存パッケージの既存脆弱性が残っている間は`|| true`で非ブロッキング運用）
- [ ] 10. `bun update`等で既存の既知脆弱性（`bun audit`実行時点で58件、Highが本番依存の`@libsql/client`経由`ws`を含む）を解消する
- [ ] 11. 10が完了したら、9の`bun audit`から`|| true`を外しブロッキングに戻す
- [ ] 12. GitHubリポジトリ設定（Code security）でDependabot Alertsを有効化する（設定ファイル不要）
- [ ] 13. Upstash Redisアカウントを作成し、環境変数（接続URL・トークン）を追加する
- [ ] 14. `server/lib/rate-limit.ts`にUpstash Redis + `hono-rate-limiter`のアダプタを実装し、認証済みエンドポイント全体にユーザー単位の緩めの上限を適用する（[api-conventions.mdのAPIのレート制限](../../architecture/decisions/api-conventions.md#apiのレート制限2026-08-23決定)参照）
- [ ] 15. AIエンドポイント（レシート読み取り・アドバイス）に、既存の日次上限とは別にユーザー単位の短時間バースト制限を追加する
- [ ] 16. JSON系エンドポイントにHonoの`bodyLimit`ミドルウェアで上限（例: 100KB）を設定する（[api-conventions.mdのリクエストボディサイズの上限](../../architecture/decisions/api-conventions.md#リクエストボディサイズの上限2026-08-23決定)参照）
- [ ] 17. Tursoトークンを対象データベース1つにスコープし、有効期限90日で再発行する（[security.mdのTursoトークンの運用方針](../../architecture/decisions/security.md#tursoトークンの運用方針2026-08-23決定)参照）。Vercelの環境変数を更新
- [ ] 18. `.github/workflows/ci.yml`（または別ワークフロー）に`gitleaks/gitleaks-action`を追加し、シークレットの誤コミットを検知する（GitHubのSecret Protection/Push protectionが既に有効な場合は重複対応のため要否を見直す）
- [ ] 19. レシート読み取り機能（[ai.md](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)）実装時、`server/lib/`にマジックバイト検証関数を実装し、Gemini送信前に実際の画像形式か確認する
- [ ] 20. Google AI Studio（またはGoogle Cloud Console）でGeminiのAPIキーを「Generative Language APIのみ」に制限する
- [ ] 21. Google Cloudの予算アラート（Budgets & alerts）とQuota（APIs & Services > Quotas）の両方を設定する（予算アラートだけでは呼び出しは止まらない点に注意）
- [ ] 22. Tursoの`turso db create new-db --from-db <db> --timestamp ...`による復元を一度実際に試し、復元後の接続先切り替え手順を確認する
- [ ] 23. レシート読み取り機能実装時、Geminiが抽出した商品名（→メモ欄）に手入力メモと同じ最大長・エスケープ処理を適用し、Gemini出力だからと検証をスキップしないようにする（[security.mdのプロンプトインジェクション対策](../../architecture/decisions/security.md#プロンプトインジェクション対策2026-08-23決定)参照）
- [ ] 24. Vercelダッシュボードで環境変数（`TURSO_AUTH_TOKEN`・`TURSO_CONNECTION_URL`・Gemini APIキー・Clerkシークレットキー）をProduction/Preview/Developmentで分離し、Preview用に本番とは別のTurso DB・低予算のGemini APIキーを用意する。機密値は「Sensitive」フラグを付ける（[security.mdのVercel環境変数のスコープ分離](../../architecture/decisions/security.md#vercel環境変数のスコープ分離2026-08-23決定)参照）
- [x] 25. `safe-stable-stringify`を依存関係に追加し、`server/lib/logger.ts`の`write`で`JSON.stringify`の代わりに使う（循環参照・BigIntを吸収してデータを残す）。既定では項目をABC順に並べ替えるため、`configure({ deterministic: false })`で書いた順のままにする（2026-09-26決定）。あわせて`write`を`try/catch`で囲み、`toJSON`・getter・`Proxy`が例外を投げる値（ライブラリが吸収しないことを実験で確認済み）のときは`fields`を捨てて`{ ...createLoggerProps, timestamp, level, message, serializeFailed: true }`を元の`level`のまま出す。導入後、Vercelのデプロイで動作を確認する（[security.mdの該当項](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）（2026-09-27完了）
- [x] 26. `logger.ts`と`error-handler.ts`のテストを追加する。
  - `logger`（2026-09-27完了。`server/lib/__tests__/logger.test.ts`）: `fields`が`level`・`message`・`requestId`等を上書きできないこと、`toJSON`が例外を投げる値の`fields`でも例外を投げず`serializeFailed`付きの行が出ること。**循環参照のテストは書かない（2026-09-27決定）**: 現状の呼び出し元（`errorHandler`）が`fields`に渡す値はすべて文字列・数値で循環参照は発生せず、Drizzleの`relations`・`with:`も未使用のためDBデータ経由でも発生しない。実害のない状態でのテスト追加は優先度が低いと判断した（`safe-stable-stringify`による吸収の実装自体は25で完了済みで、変更なし）
  - `errorHandler`（2026-10-02完了。`server/shared/__tests__/errorHandler.test.ts`）: `DrizzleQueryError`の`params`の値がログに出ないこと（`message`・`stack`も出ないこと）、404の`HTTPException`で`event`・`userId`付きの`warn`が出ること、それ以外のステータスでは出ないこと。ログの出力は`console`の`vi.spyOn`で検証する（27の`silent: 'passed-only'`と干渉しないことを実験で確認済み）。`findLogByMessage`ヘルパーで複数回出るログ（errorHandler自身のログ＋requestLoggerの「リクエスト完了」ログ）から対象メッセージの行だけを取り出して検証する
- [x] 27. `apps/web/vitest.config.ts`のトップレベルの`test`に`silent: 'passed-only'`を追加し、成功したテストのリクエスト完了ログ（JSON）を出さない（失敗したテストのログは表示される。理由は[testing-strategy.md](../../architecture/decisions/testing-strategy.md)の「テスト中のログ出力の抑止」参照）（2026-09-27完了）

## フロントエンド

- [ ] 1. （フロントエンド実装なし）

## クリーンアップ

- [ ] 1. （未定）

## 将来検討（今回はスコープ外）

- Dependabot version updates または Renovate による依存パッケージの自動更新PR導入
- ログの長期保存（Vercelのランタイムログの保存期間はHobbyで1時間・Proで1日と短く、IDOR試行などのセキュリティイベントをあとから調べるには不足する。Log Drains等を検討する。[security.md](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）
- リクエスト完了ログへの`userId`の追加（Vercelが標準で持たない、アプリ内でしか分からない情報を足して完了ログの価値を高める）
