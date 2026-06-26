# セットアップ作業記録

## パッケージインストール

- [x] 1. `@clerk/hono` `@hono/swagger-ui` `@tanstack/react-query` `drizzle-orm` `@libsql/client` をインストール
- [x] 2. `orval` をdevDependenciesにインストール

---

## 環境変数（`apps/web/.env.local`）

- [x] 1. Clerk関連の環境変数を設定（`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` `CLERK_PUBLISHABLE_KEY` `CLERK_SECRET_KEY`）
- [x] 2. Turso関連の環境変数を設定（`TURSO_CONNECTION_URL` `TURSO_AUTH_TOKEN`）
- [x] 3. Clerkのリダイレクト先URLを設定

---

## Hono API エントリポイント（`app/api/[...route]/route.ts`）

- [x] 1. `Hono` から `OpenAPIHono` に切り替え
- [x] 2. `/api/doc` にOpenAPIスペックを公開
- [x] 3. `/api/ui` にSwagger UIを設定
- [x] 4. Bearer認証スキームをOpenAPIレジストリに登録
- [x] 5. 各ルートごとに `clerkMiddleware()` を適用（`@clerk/hono` を使用）

---

## Clerk Next.js ミドルウェア（`proxy.ts`）

- [x] 1. `/sign-in` `/sign-up` `/api/ui` `/api/doc` を公開ルートとして設定
- [x] 2. その他すべてのルートを認証必須に設定

---

## DBクライアント（`server/lib/db.ts`）

- [x] 1. Next.js用のDrizzle DBクライアントを作成（`@repo/db` の `db` は使わない）

---

## TanStack Query Provider（`components/provider.tsx`）

- [x] 1. `QueryClientProvider` を `'use client'` コンポーネントとして作成
- [x] 2. `app/layout.tsx` の `<body>` 内でラップ

---

## orval設定

- [x] 1. `apps/web/orval.config.ts` を作成（input: `/api/doc`、output: `lib/api/generated/`）
- [x] 2. `package.json` の `scripts` に `generate` コマンドを追加
- [x] 3. `bun run generate` を実行して型・hooksを生成

---

## tsconfig パス追加（`apps/web/tsconfig.json`）

- [x] 1. `@/server/*` のパスエイリアスを追加

---

## VSCode設定（`.vscode/settings.json`）

- [x] 1. `js/ts.preferences.includePackageJsonAutoImports: "on"` を追加（ワークスペースパッケージの自動import補完を有効化）

---

## `@repo/db` package.json 修正

- [x] 1. `exports` フィールドの `.` を `dist/index.d.ts` に変更
- [x] 2. `exports` フィールドの `./schema` を `src/schema/index.ts` に変更（VSCode自動import補完のため）

---

## `@repo/common` package.json 修正

- [x] 1. `exports` フィールドを追加（VSCode自動import補完のため）

---

## turbo.json

- [x] 1. `globalEnv` に `TURSO_CONNECTION_URL` `TURSO_AUTH_TOKEN` を追加
