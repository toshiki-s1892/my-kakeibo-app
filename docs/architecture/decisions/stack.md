# 技術スタックの選定理由

各技術を採用した理由・懸念点をまとめたもの。実装方針の詳細は[api-conventions.md](./api-conventions.md)・[frontend-conventions.md](./frontend-conventions.md)を参照。

## モノレポ管理: Turborepo

**採用理由:**
- `apps/web` と `packages/db` など複数ワークスペース間でのコード共有が容易
- タスクのキャッシュにより CI・ローカルのビルドが高速
- Vercel 製のため Next.js との親和性が高い

**懸念点:** 特になし。Turborepo は現状のスタックに対して素直に機能する。

---

## ランタイム / パッケージマネージャ: Bun

**採用理由:**
- npm / yarn より高速なインストール・実行
- TypeScript をネイティブで実行可能（`tsx` 不要な場面も多い）
- `bun.lock` による再現性の高い依存関係管理

**懸念点:** 一部の npm パッケージで Bun 未対応のケースがある。Node.js が前提のライブラリを使う際は動作確認が必要。

---

## フレームワーク: Next.js 16 (App Router) + React 19

**採用理由:**
- App Router による SSR / RSC の活用でパフォーマンスを最適化できる
- Clerk・Hono・Tailwind など周辺ライブラリの Next.js 対応が充実している
- Vercel へのデプロイとの相性が最良

**懸念点:** Next.js 16 + React 19 は最新バージョンのため、エコシステムの一部ライブラリが未対応の可能性がある。ライブラリ追加時は都度確認が必要。

---

## 認証: Clerk

**採用理由:**
- サインアップ・サインイン・セッション管理・MFA を外部委譲でき、認証の実装コストをゼロに近づけられる
- Next.js App Router 向けの公式 SDK（`@clerk/nextjs`）が充実している
- `clerk_id` を自前 DB の `users` テーブルと紐付けることで、アプリ固有のユーザー情報を柔軟に管理できる

**懸念点:** 無料枠を超えると有料になる。ユーザー数が増えた場合のコスト試算が必要。

---

## API: Hono + Zod OpenAPI

**採用理由:**
- Edge Runtime に対応しており、Vercel Edge Network で低レイテンシな API を実現できる
- `@hono/zod-openapi` によりスキーマ定義と OpenAPI ドキュメント生成を一元管理できる
- `@hono/clerk-auth` で Clerk 認証と簡単に統合できる

**懸念点:** Next.js の Route Handler に Hono を乗せる構成はオーバーヘッドが若干あるが、このプロジェクト規模では問題にならない。

実装方針（ルート構成・認証ミドルウェアの適用方法等）は[api-conventions.md](./api-conventions.md)を参照。

---

## ORM + DB: Drizzle ORM + Turso（分散 SQLite）

**採用理由:**
- Drizzle はスキーマを TypeScript で定義でき、Zod との連携（`drizzle-zod`）で DB 定義からバリデーションスキーマを自動生成できる
- Turso は Edge Runtime に対応した分散 SQLite で、グローバルレプリケーションによる低レイテンシを実現できる
- SQLite は小〜中規模アプリに十分な性能を持ち、インフラコストが低い

**懸念点:** SQLite は書き込み並行性が低いため、同時書き込みが多い場面では PostgreSQL より劣る。ユーザー数が大幅に増えた場合は DB の移行を検討する必要がある。

**再検討した代替案（不採用）:** UUID生成の簡潔さ（`gen_random_uuid()`がネイティブにある）を理由にNeon（サーバーレスPostgres）への移行を検討したが、(1) Tursoを選定した当初の「グローバル分散による低レイテンシ」という利点はこのアプリの個人・家族利用規模では元々不要、(2) 「無料運用を維持し続けたい」という要件に対し、Tursoの行数ベースの無料枠（月5億行読み取り・5GBストレージ）の方がNeonのコンピュート時間ベースの無料枠より制限に達しにくく安全、という理由でTursoを維持する結論とした。

DBクライアントの分離方針（`packages/db`と`apps/web/server/lib/db.ts`の役割分担）は[api-conventions.md](./api-conventions.md#dbクライアントの分離)を参照。

**マイグレーション運用: `drizzle-kit generate` + `push`（`migrate`は不採用）**

スキーマ変更は `db:generate`（マイグレーションSQLファイルを履歴として出力）→ `db:push`（schema.tsと実DBを直接diffして同期）の順で適用する。`migrations/*.sql`は変更履歴の記録用であり、実際の反映には使われない。

**検討した代替案（不採用）:** `drizzle-kit migrate`（マイグレーションファイルの内容を順次適用し、適用履歴をDB側で管理する方式）を試したが、Turso（libsql HTTPドライバ）では全マイグレーションを単一の`db.transaction()`でラップする`migrate`の実装がトランザクションを正しく完了できず、無限にハングすることを実機検証で確認した。`push`はトランザクションを使わず単発リクエストの集合で適用するため、この問題が起きない。そのため`migrate`運用は不採用とし、`push`運用を維持する。

---

## ID設計: UUID（全テーブル共通）

**採用ツール:** 各テーブルの主キーを `integer autoIncrement` ではなく `text`（UUID。`crypto.randomUUID()`で生成）に統一する。`users`・`categories`・`family_members`・`transactions`・`category_pins`・`transaction_parties`・`recurring_transactions`・`ai_advice_sessions`・`ai_advice_messages` が対象（ログ専用テーブルの例外は下記参照）。

**採用理由:**
- 連番IDをURLや`:id`パスパラメータにそのまま使うと、IDの大きさから「だいたい何件登録されているか」という業務情報が推測できてしまう。UUIDにすることでこれを避けられる
- 「内部用の連番ID + 外部公開用UUID」のデュアルID方式も検討したが、内部結合の性能差はこのアプリの規模（個人・家族利用）では無視できるレベルのため、実装が複雑になるデュアルID方式は不採用とし、PK自体をUUIDにする方式（シンプル）を選んだ

**前提として:** IDが推測困難であること自体はセキュリティ対策の主軸ではない（「隠すことによる安全」に頼らない）。**全エンドポイントで`user_id`の所有者チェックを必須とする**ことが本質的な対策であり、UUID化はその上での追加の防御層という位置付け（詳細は[security.md](./security.md#idor不正な直接オブジェクト参照対策)参照）。

**実装方法:** 各テーブルのDrizzleスキーマで `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())` を使い、アプリケーション側でUUIDを生成する（Drizzle公式の`$defaultFn`機能。[ドキュメント](https://orm.drizzle.team/docs/column-types/sqlite)）。

**検討した代替案（不採用）:** SQLiteのDEFAULT句内で`randomblob()`・`hex()`等を組み合わせてDB側のみでUUIDを生成する方法も検討したが、可読性が著しく悪く、本プロジェクトはDBアクセスを`server/lib/`に集約するDALパターン（[api-conventions.md](./api-conventions.md)）を採用しているため生SQLによるバイパス経路が存在せず、アプリ側生成で十分と判断し不採用とした。

**例外: `recurring_transaction_logs`・`ai_usage_logs`は`integer autoIncrement`を採用** — これらはCronやAI機能の利用記録・キャッシュとして内部的に生成・参照するだけのログ専用テーブルで、`id`がクライアントに公開されるAPIエンドポイントを持たない。UUID化の採用理由（URL上でのID推測防止・IDOR対策）が当てはまらないため、ログ確認時の可読性を優先しintegerのままとした。

**影響範囲:**
- `packages/db/src/schema/*.ts` の全テーブルのPK定義変更（マイグレーション必要）
- `server/shared/id-schema.ts` の `IdParamSchema`・`IdResponseSchema` を `z.coerce.number()` から UUID文字列のバリデーションに変更
- 既存実装（プロフィール設定機能）への影響を実装時に確認する

---

## スタイリング: Tailwind CSS v4

**採用理由:**
- ユーティリティファーストで UI の実装速度が高い
- v4 は CSS ネイティブな設計でビルドが高速

**懸念点:** shadcn/ui は Tailwind v3 をベースに設計されており、v4 との互換性に一部制約がある。コンポーネントの追加・カスタマイズ時に動作確認が必要。

---

## UI コンポーネント: shadcn/ui + Base UI

**採用理由:**
- shadcn/ui はコンポーネントをプロジェクト内にコピーする方式のため、依存関係に縛られずカスタマイズが自由
- Base UI（MUI 製）はヘッドレスなアクセシブルコンポーネントを提供し、shadcn/ui でカバーしきれない部品を補完できる

**懸念点:** 2つのコンポーネントライブラリを併用するため、役割分担を明確にしないと実装がばらつく。基本は shadcn/ui を使い、Base UI は shadcn/ui にないコンポーネントに限定する運用が望ましい。

---

## AI: Google Gemini API

**採用理由:**
- Gemini は画像認識（マルチモーダル）とテキスト生成の両方に対応しており、レシート読み取りと支出分析・アドバイスを1つのAPIで賄える
- Google AI Studio での無料枠が充実しており、開発・検証コストを抑えられる
- `@google/generative-ai`（公式 SDK）で TypeScript から簡単に利用できる

**用途:** 3つの機能で利用する。詳細は[specs/features/ai.md](../../specs/features/ai.md)を参照。

| featureCode | 機能 | Gemini の使い方 |
|---|---|---|
| `RECEIPT_SCAN`(1) | レシート読み取り | 画像+カテゴリ一覧をマルチモーダルで送信し、構造化出力（`generateContent`）で複数行の商品・金額・カテゴリ候補を抽出 |
| `EXPENSE_ANALYSIS`(2) | 簡易支出分析 | 月次データをテキストで送信し、短いコメントを生成（`generateContent`。メンバーごとに1日1回キャッシュ） |
| `DETAILED_ADVICE`(3) | 本格的アドバイス | 取引データ・居住地域・年齢・家族構成を含むプロンプトを送信し、`generateContentStream`でSSEとして逐次応答 |

**懸念点:** APIキーの管理に注意が必要。サーバーサイド（Honoハンドラ内）でのみ呼び出し、クライアントには公開しない。利用ログは `ai_usage_logs` テーブルに記録してコスト管理に活用する。

---

## ホスティング: Vercel（Hobbyプラン）

**採用理由:**
- Next.js との親和性が最良で、デプロイ・環境変数管理が容易
- Hobbyプランが無料（個人・家族利用の想定アクセス量なら十分な範囲）

**懸念点:** Hobbyプランは[非商用・個人利用に限定](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)される。第三者向けの公開・収益化を行う場合はProプラン（$20/ユーザー/月）への切り替えが必要。

**前提として:** この選定は確定事項ではなく、要件（商用展開の可否等）が変わった場合は再検討の対象とする。
