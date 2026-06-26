# テスト戦略

**採用ツール:**
- 単体・結合テスト: Vitest
- E2Eテスト: Playwright

**採用理由:**
- Next.js公式ドキュメントが単体テストにVitestを推奨している
- Playwrightは公式ドキュメントに記載されたE2Eツールである

**コンポーネントテストは導入しない（2026-06-25決定）:** 当初はStorybook（`@storybook/nextjs-vite` + Vitest addon）の採用を検討したが、個人開発でのメンテコスト（Next.jsのメジャーバージョンアップへの追従が遅れがちな懸念があった）と、表示専用コンポーネント（props→DOM）に対するテストの効果の低さ（実務上、バグの大半はビジネスロジック・結合部分・画面をまたぐ遷移で発生する）を踏まえ、見送ることにした。コンポーネントの見た目確認は[frontend-conventions.md](./frontend-conventions.md#コンポーネントカタログページ)のカタログページ（開発時のみ）で代替する。

**導入順序:**
1. Vitest（単体テスト）
2. Playwright（E2E） — プロフィールセットアップ画面のデザイン修正完了後に着手する（デザイン未確定の画面に対してE2Eを先に書くと、デザイン変更で書き直しになるため）

**テストの粒度:**

| 層 | 対象 | DB |
|---|---|---|
| 単体（Vitest） | `packages/common`・zodスキーマなどの純粋ロジック | 使わない |
| 結合（Vitest + Honoの`app.request()`） | `server/routes/{feature名}/handler.ts`（APIエンドポイント単位） | 使う（ローカルSQLite） |
| E2E（Playwright） | 複数画面をまたぐ主要フロー | 使う（ローカルSQLite） |

E2Eは最初から全分岐を網羅せず、正常系（ゴールデンパス）1本（例: サインイン→プロフィールセットアップ→ダッシュボード遷移）から開始する。異常系・バリデーションエラーなどの分岐は単体テストでカバーする。

**結合テスト用DBの構成:**

`server/lib/db.ts` を環境ベースで分岐させ、本番（`NODE_ENV === 'production'`）以外はローカルSQLite/インメモリDBを使う。

```ts
const isProd = process.env.NODE_ENV === 'production';

export const db = drizzle({
  connection: isProd
    ? { url: process.env.TURSO_CONNECTION_URL!, authToken: process.env.TURSO_AUTH_TOKEN! }
    : { url: process.env.DATABASE_URL ?? 'file:./local.db' },
});
```

- ローカル開発: `DATABASE_URL` 未設定時は `file:./local.db`
- 結合テスト: テストのセットアップで `process.env.DATABASE_URL = ':memory:'` をセットしてからimportし、`drizzle-orm/libsql/migrator` の `migrate()` で `packages/db/migrations` を流し込む
- 本番: Turso
