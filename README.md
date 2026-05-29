# my-kakeibo-app

AI による支出分析・レシート読み取りを備えた、個人・家族向け家計簿 Web アプリケーション。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| モノレポ管理 | Turborepo |
| ランタイム / パッケージマネージャ | Bun |
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| 認証 | Clerk |
| API | Hono + Zod OpenAPI |
| ORM | Drizzle ORM |
| DB | Turso (分散 SQLite) |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/ui + Base UI |
| フォーム | React Hook Form + Zod |

## ワークスペース構成

```
my-kakeibo-app/
├── apps/
│   └── web/              # Next.js Web アプリ（ポート 3001）
└── packages/
    ├── db/               # Drizzle スキーマ・マイグレーション
    ├── common/           # 共通定数・コード値定義
    ├── ui/               # 共有 UI コンポーネント
    ├── tailwind-config/  # Tailwind 共通設定
    ├── eslint-config/    # ESLint 共通設定
    └── typescript-config/ # TypeScript 共通設定
```

## ローカル起動

### 前提条件

- Bun >= 1.3.13
- Node.js >= 18

### 環境変数

ルート直下と `apps/web/` に `.env.local` を作成し、以下を設定する。

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Turso
TURSO_CONNECTION_URL=
TURSO_AUTH_TOKEN=
```

### インストール・起動

```bash
# 依存関係インストール
bun install

# 開発サーバー起動（全ワークスペース）
bun dev
```

Web アプリは http://localhost:3001 で起動します。

### DB マイグレーション

`packages/db/` で実行する（`drizzle.config.ts` がそこにあるため）。

```bash
cd packages/db
bunx drizzle-kit migrate
```

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義](docs/requirements/overview.md) | 機能要件・非機能要件 |
| [機能仕様](docs/specs/overview.md) | 画面一覧・API・コード値定義 |
| [アーキテクチャ](docs/architecture/overview.md) | 技術スタック・DBスキーマ・ディレクトリ構成 |
