# セキュリティ対応方針

このプロジェクトで採用しているスタックにより、主要なセキュリティ対策は自動的に適用されている。

## SQLインジェクション

**Drizzle ORM のクエリビルダーが自動でパラメータ化クエリを生成するため対策済み。**

```ts
// ✅ 安全: Drizzle が内部でパラメータ化クエリに変換する
await db.insert(users).values({ clerkId, name });

// ⚠️ 注意: sql テンプレートリテラルは安全だが、文字列結合は危険
await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`); // ✅ 安全
await db.execute(`SELECT * FROM users WHERE id = '${userId}'`); // ❌ 危険
```

## XSS（クロスサイトスクリプティング）

**React が JSX レンダリング時に自動でエスケープするため対策済み。**

ユーザーが入力した文字列に `<script>` タグ等が含まれていても、React がテキストとして扱うため実行されない。`dangerouslySetInnerHTML` は使用しないこと。

**うっかり混入を防ぐため、`react/no-danger`（eslint-plugin-react）をESLintルールとして有効化済み（2026-08-23決定）。** `eslint-plugin-react`の`recommended`プリセットには含まれないため、`packages/eslint-config/react-internal.js`・`next.js`の`rules`に個別追加している。将来サニタイズ済みHTMLを描画する必要が生じた場合は、該当行に`eslint-disable-next-line`を付け、DOMPurify等での事前サニタイズを必須とすること。

## IDOR（不正な直接オブジェクト参照）対策

**`:id`を含む全エンドポイント（GET/PUT/DELETE）で、`WHERE id = :id AND user_id = auth.userId`のように所有者チェックを必須とする。** カテゴリ・家族構成メンバーなど、ユーザーごとのリソースを扱う機能すべてに適用する。

IDを推測されにくくする（[UUID化](./stack.md#id設計-uuid全テーブル共通)）ことは補助的な対策であり、本質的な防御はこの所有者チェック。所有者チェックが漏れると、IDが連番かUUIDかに関わらず他ユーザーのデータにアクセスできてしまう。

**再発防止（2026-08-23決定）:** `:id`を含む全エンドポイントに「他ユーザーのリソースを指定すると403/404になる」ことを確認するテストを必須化する（[testing-strategy.mdの該当規約](./testing-strategy.md#各層の検証責務重複を避ける)参照）。レビュー方針の記述だけでは実装漏れに気づけないため、テストで機械的に担保する。

## 機微データの列暗号化（アプリ層暗号化）（2026-08-23決定）

DBが丸ごと流出するシナリオ（接続情報の漏えい・バックアップの誤公開等）に備え、**本人以外の第三者の同意なく入力されうる機微フィールドはアプリ層で暗号化**する。

**対象フィールド:**

- `transaction_parties.name`（取引先名。勤務先名が入ると収入取引と組み合わせて勤務先が特定されうる）
- `family_members.name`・`family_members.birthday`（家族の氏名・生年月日。本人以外の同意なく登録される）

`categories`・`transactions.amount`等は対象外（カテゴリ名は本人が選ぶ定型的な値、金額単体は個人を特定しない）。

**実装方針:**

- `server/lib/crypto.ts` に `encrypt()`/`decrypt()` を1箇所実装する（AES-256-GCM）。外部サービスアダプタと同じ思想で、暗号化ロジックへのアクセスはこのモジュール境界に一本化し、テストは`vi.mock`で差し替える
- 暗号文は鍵バージョン識別子を含む形式（例: `v1:<iv>:<ciphertext>`）で保存する。将来鍵基盤を差し替える際、新旧の鍵を`decrypt()`内で読み分けられるようにするため（既存行の一括再暗号化を強制されない）
- **鍵管理はフェーズを分ける**: リリース初期はVercelの環境変数（Production限定公開、Encrypted at rest）に32byteの鍵を1本置く（`v1`）。将来AWS KMS等へ移行する際は`v2`を追加し、新規書き込みから順次`v2`に切り替える

## 退会時の完全削除（2026-08-23決定）

既存の論理削除（`deletedAt`）は維持する（過去の取引のカテゴリ表示等を壊さないため）。一方で「退会時はデータを完全に消してほしい」という要望には別の仕組みで応える。

**アカウント削除UI・削除操作自体は自前で実装しない。** [UserButtonのドロップダウン（Manage Account）](./api-conventions.md)からClerkの`UserProfile`を開く既存方針（[architecture/overview.mdのヘッダー構成](../overview.md)参照）に乗せ、Clerkダッシュボードでアカウント削除機能を有効化するだけで、退会操作自体はClerkが提供するUIで完結する。

アプリ側はClerkが発火する **`user.deleted` Webhook** を受け取り、そのユーザーに紐づく全テーブル（`categories`・`family_members`・`transaction_parties`・`transactions`・`recurring_transactions`・`ai_advice_sessions`・`ai_advice_messages`・`ai_usage_logs`・`users`本体）の行をハード削除する処理を実装する（論理削除ではなく物理削除。子→親の順序に注意）。

## 認証の多要素化（MFA / 2FA）（2026-08-23決定）

Clerkダッシュボードの設定でMFA（認証アプリ・TOTP等）を有効化し、ユーザーが`UserProfile`から**任意で**有効化できるようにする。全ユーザーへの強制は行わない（オンボーディング離脱を増やすリスクを避けるため）。アプリコード側の変更は不要（Clerk側の設定のみ）。

## エラーログにリクエストの生値を含めない（2026-08-23決定）

`errorHandler`（`server/shared/error-handler.ts`）の想定外エラー分岐では、`error`オブジェクトを丸ごと`console.error`に渡さず、`message`・`stack`のみをログ出力する。DB制約違反等のエラーはメッセージに失敗したクエリの値を含むことがあり、[列暗号化対象フィールド](#機微データの列暗号化アプリ層暗号化2026-08-23決定)の復号後の生値がVercelのログ基盤に流出する経路になり得るため。

## セキュリティヘッダー（2026-08-23決定）

**CSP（Content-Security-Policy）**: `apps/web/proxy.ts`の`clerkMiddleware`が持つ`contentSecurityPolicy`オプションで設定する（[Clerk公式ドキュメント](https://clerk.com/docs/guides/secure/best-practices/csp-headers)）。CSPを`next.config.ts`の`headers()`で自前定義すると、ClerkのFAPIホスト・Cloudflare bot対策等の許可漏れで認証が壊れるリスクがあるため、Clerk側の仕組みに乗せる。clickjacking対策として`frame-ancestors: 'none'`をカスタムdirectiveで追加する。

**その他のヘッダー**: CSP以外は`apps/web/next.config.ts`の`headers()`で設定する。

| ヘッダー                    | 値                                    | 目的                                                                   |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `X-Content-Type-Options`    | `nosniff`                             | MIMEスニッフィング対策（レシート画像アップロード機能があるため）       |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | HTTPSへのダウングレード・中間者攻撃対策（Vercelは自動HTTPS化だが明示） |
| `X-Frame-Options`           | `DENY`                                | clickjacking対策（CSPの`frame-ancestors`と二重の防御）                 |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`     | 他サイトへの遷移時にURLの詳細情報を渡さない                            |

## Tursoトークンの運用方針（2026-08-23決定）

Tursoの認証トークンはデータベース単位・読み取り専用/書き込み可・有効期限でスコープを絞れる（[Turso公式のAuthorization](https://docs.turso.tech/sdk/authorization)）。

- **DB単位にスコープする**: `TURSO_AUTH_TOKEN`は対象のデータベース1つだけに絞ったトークンを使う（組織全体に及ぶトークンは使わない）
- **有効期限を設定する**: 90日を既定とし、失効前にVercelの環境変数を再発行・更新する（無期限トークンは「漏れても気づかない」リスクの温床になるため）
- **読み取り専用トークンへの分離は現時点では不要**: このアプリはHonoの同一サーバーが読み書き両方を行うアーキテクチャのため、アプリ本体用トークンを読み取り専用に分離しても複雑さが増すだけで得られる効果が薄い。将来、分析用途やDrizzle Studioでの手動閲覧等、書き込み不要な用途が増えた場合はその用途専用の読み取り専用トークンを別途発行する

## 依存パッケージの既知脆弱性（CVE）対策（2026-08-23決定）

- **CI**: `.github/workflows/ci.yml`に`bun audit`のステップを追加する。**2026-08-23時点で既存の脆弱性（58件、High 22件含む。本番依存では`@libsql/client`経由の`ws`が対象）が残っているため、修正が完了するまでは非ブロッキング（`bun audit || true`）で運用する**。修正完了後、`|| true`を外してブロッキングに戻す
- **GitHub Dependabot Alerts**: リポジトリ設定（Code security）で有効化する（設定ファイル不要）。既知脆弱性の発見を通知で受け取る
- **シークレットの誤コミット検知**: `.github/workflows/ci.yml`（または別ワークフロー）に`gitleaks`（`gitleaks/gitleaks-action`）を追加し、API キー・トークンの誤コミットをPR時に機械的に検知する

## レシート画像アップロードのファイル検証（2026-08-23決定）

拡張子・`Content-Type`ヘッダーは偽装可能なため、[レシート読み取り機能](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)の実装時は**ファイル先頭のマジックバイトで実際に画像形式か確認**してからGeminiに送信する（JPEG: `FF D8 FF`、PNG: `89 50 4E 47`、WebP: `RIFF....WEBP`）。軽量な検証のため専用パッケージは使わず、`server/lib/`に数十行程度の自前関数として実装する。

## Google Gemini APIキーの権限・予算上限（2026-08-23決定）

- **APIキーをGenerative Language APIのみに制限する**（Google AI Studio・Google Cloud Consoleのキー設定）。VercelのEdge Functionは固定IPを持たないため、IPアドレス制限は使えない
- **予算アラートと割り当て（Quota）の両方を設定する**: [Google Cloud公式](https://docs.cloud.google.com/billing/docs/how-to/budget-api-overview)の通り、**予算アラートは通知が来るだけでAPI呼び出しは止まらない**。実際に上限で止めるには別途Quota（APIs & Services > Quotas）の設定が必要。キーが漏れて[アプリ側の日次上限](../../specs/features/ai.md#共通方針)を経由せず直接叩かれた場合の被害を抑えるための最後の砦

## プロンプトインジェクション対策（2026-08-23決定）

[レシート読み取り機能](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)はユーザーがアップロードした画像の中身を信頼しない前提で扱う。悪意ある画像に隠しテキストを仕込み、Geminiを意図しない出力に誘導する攻撃（indirect prompt injection）が理論上成立するため、以下で影響範囲を絞る。

- **カテゴリ提案は構造化出力で既存カテゴリのみに制約する**（既存方針。任意の文字列を出力させない）
- **商品名（→メモ欄に反映される自由テキスト）は「Geminiが生成した、信頼できない入力」として扱う**。手入力のメモと同じ最大長・エスケープ処理（[XSS対策](#xssクロスサイトスクリプティング)）を必ず経由させ、Geminiの出力だからといって検証をスキップしない

## CSRF対策（2026-08-23決定・確認事項）

Clerkのセッションcookieはデフォルトで`SameSite=Lax`（[Clerk公式](https://clerk.com/docs/guides/secure/best-practices/csrf-protection)）。これは「状態を変更する操作をGETリクエストにしない」限りCSRFを防げる設定のため、**一覧取得はGET、作成・更新・削除はPOST/PUT/DELETEに限定する**という既存のREST規約を今後も崩さない（[api-conventions.mdのHonoルートの実装方針](./api-conventions.md#honoルートの実装方針)参照）。この規約が守られている限り、追加のCSRF対策（トークン発行等）は不要。

## Vercel環境変数のスコープ分離（2026-08-23決定）

Vercelの環境は Production・Preview・Development の3つがあり、**Previewデプロイ（PRごとのプレビュー環境）に本番相当の認証情報を渡さないのが公式ベストプラクティス**（[Vercel公式](https://vercel.com/docs/environment-variables/sensitive-environment-variables)）。

- `TURSO_AUTH_TOKEN`・`TURSO_CONNECTION_URL`: Preview環境には本番DBとは別のTurso DB（開発用）の値を設定する
- Gemini APIキー: Preview環境には本番より低い予算上限を設定した別キーを使う
- Clerkのシークレットキー: Clerk側もdevelopment/production instanceが分かれているため、対応するキーを環境ごとに設定する
- 上記いずれも、Vercelダッシュボードで「Sensitive」フラグを付ける（保存後は値が二度と表示されず、`vercel env pull`でも取得不可になる）

## Tursoのバックアップ・復旧（2026-08-23決定）

Tursoは継続的にバックアップを取っており、Point-in-Time Recovery（PITR）で任意時点への復元が可能（プランにより保持期間が異なる。[Turso公式](https://docs.turso.tech/features/point-in-time-recovery)）。復元は既存DBへの上書きではなく**新しいデータベースが作成される**ため、復元後はアプリの接続先（`TURSO_CONNECTION_URL`）を切り替える作業が発生する。「バックアップが取られている」ことの確認だけでなく、**実際に復元コマンド（`turso db create new-db --from-db old-db --timestamp ...`）を一度試し、復元後の接続切り替え手順を確認しておく**（本番障害時に手順を初めて試すことがないようにするため）。

- 自動更新PR（Dependabot version updates または Renovate）の導入は将来検討とする

## その他フレームワーク・サービスが対応済みのもの

| 項目                 | 対応                                                                |
| -------------------- | ------------------------------------------------------------------- |
| 認証・セッション管理 | Clerk が担当                                                        |
| HTTPS / TLS          | Vercel が自動適用                                                   |
| 入力バリデーション   | Zod（フロントエンド・バックエンド両方）                             |
| APIキー等の秘匿      | 環境変数で管理（`NEXT_PUBLIC_` プレフィックスは公開されるため注意） |

## 今後対応が必要になる可能性があるもの

- **レートリミット**: ユーザー数が増えた場合に Hono ミドルウェアで対応
- **依存パッケージの自動更新PR**: Dependabot version updates または Renovate の導入
