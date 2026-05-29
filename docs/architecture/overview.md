# アーキテクチャ

## 構成図

```
my-kakeibo-app/          ← Turborepo モノレポ
├── apps/
│   └── web/             ← Next.js 16 (App Router)
└── packages/
    ├── db/              ← Drizzle ORM スキーマ・マイグレーション
    ├── common/          ← 共通定数・コード値
    ├── ui/              ← 共有 UI コンポーネント
    ├── tailwind-config/ ← Tailwind 共通設定
    ├── eslint-config/   ← ESLint 共通設定
    └── typescript-config/ ← TypeScript 共通設定
```

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.2.0 |
| 言語 | TypeScript | 5.9.2 |
| ランタイム | Bun | - |
| モノレポ管理 | Turborepo | - |
| 認証 | Clerk | `@clerk/nextjs` v7 |
| API | Hono + Zod OpenAPI | v4 |
| ORM | Drizzle ORM | - |
| DB | Turso（分散 SQLite） | - |
| スタイリング | Tailwind CSS v4 | - |
| UI コンポーネント | shadcn/ui + Base UI | - |
| フォーム | React Hook Form + Zod | - |

## DB スキーマ

```
users
  id, clerk_id, regionCode, genderCode, birthYear
  createdAt, updatedAt, deletedAt

categories
  id, userId → users.id, typeCode, name, createdAt

transactions
  id, userId → users.id, familyMemberId → family_members.id
  categoryId → categories.id
  amount, transactionDate, memo, createdAt, updatedAt

family_members
  id, userId → users.id
  relationshipCode（1:本人 2:配偶者 3:子 4:親 5:その他）, genderCode, birthYear, createdAt

ai_usage_logs
  id, userId → users.id, featureCode, createdAt
```

## ディレクトリ構成（apps/web）

```
apps/web/
├── app/
│   ├── (auth)/          ← 認証ページ群（Clerk）
│   ├── (main)/          ← 認証済みページ群
│   └── api/[...route]/  ← Hono API エントリポイント
├── features/            ← 機能別コンポーネント・ロジック
├── components/
│   └── ui/              ← shadcn/ui コンポーネント
└── server/              ← サーバーサイドミドルウェア
```

## データフロー

```
Browser
  → Next.js App Router (SSR/RSC)
    → Clerk 認証チェック (middleware)
      → Hono API (/api/...)
        → Drizzle ORM
          → Turso (SQLite)
```

## マイグレーション管理

`packages/db/migrations/` に SQL マイグレーションファイルを管理。  
`packages/db/drizzle.config.ts` で設定。

## 技術的意思決定

### モノレポ管理: Turborepo

**採用理由:**
- `apps/web` と `packages/db` など複数ワークスペース間でのコード共有が容易
- タスクのキャッシュにより CI・ローカルのビルドが高速
- Vercel 製のため Next.js との親和性が高い

**懸念点:** 特になし。Turborepo は現状のスタックに対して素直に機能する。

---

### ランタイム / パッケージマネージャ: Bun

**採用理由:**
- npm / yarn より高速なインストール・実行
- TypeScript をネイティブで実行可能（`tsx` 不要な場面も多い）
- `bun.lock` による再現性の高い依存関係管理

**懸念点:** 一部の npm パッケージで Bun 未対応のケースがある。Node.js が前提のライブラリを使う際は動作確認が必要。

---

### フレームワーク: Next.js 16 (App Router) + React 19

**採用理由:**
- App Router による SSR / RSC の活用でパフォーマンスを最適化できる
- Clerk・Hono・Tailwind など周辺ライブラリの Next.js 対応が充実している
- Vercel へのデプロイとの相性が最良

**懸念点:** Next.js 16 + React 19 は最新バージョンのため、エコシステムの一部ライブラリが未対応の可能性がある。ライブラリ追加時は都度確認が必要。

---

### 認証: Clerk

**採用理由:**
- サインアップ・サインイン・セッション管理・MFA を外部委譲でき、認証の実装コストをゼロに近づけられる
- Next.js App Router 向けの公式 SDK（`@clerk/nextjs`）が充実している
- `clerk_id` を自前 DB の `users` テーブルと紐付けることで、アプリ固有のユーザー情報を柔軟に管理できる

**懸念点:** 無料枠を超えると有料になる。ユーザー数が増えた場合のコスト試算が必要。

---

### API: Hono + Zod OpenAPI

**採用理由:**
- Edge Runtime に対応しており、Vercel Edge Network で低レイテンシな API を実現できる
- `@hono/zod-openapi` によりスキーマ定義と OpenAPI ドキュメント生成を一元管理できる
- `@hono/clerk-auth` で Clerk 認証と簡単に統合できる

**懸念点:** Next.js の Route Handler に Hono を乗せる構成はオーバーヘッドが若干あるが、このプロジェクト規模では問題にならない。

---

### ORM + DB: Drizzle ORM + Turso（分散 SQLite）

**採用理由:**
- Drizzle はスキーマを TypeScript で定義でき、Zod との連携（`drizzle-zod`）で DB 定義からバリデーションスキーマを自動生成できる
- Turso は Edge Runtime に対応した分散 SQLite で、グローバルレプリケーションによる低レイテンシを実現できる
- SQLite は小〜中規模アプリに十分な性能を持ち、インフラコストが低い

**懸念点:** SQLite は書き込み並行性が低いため、同時書き込みが多い場面では PostgreSQL より劣る。ユーザー数が大幅に増えた場合は DB の移行を検討する必要がある。

---

### スタイリング: Tailwind CSS v4

**採用理由:**
- ユーティリティファーストで UI の実装速度が高い
- v4 は CSS ネイティブな設計でビルドが高速

**懸念点:** shadcn/ui は Tailwind v3 をベースに設計されており、v4 との互換性に一部制約がある。コンポーネントの追加・カスタマイズ時に動作確認が必要。

---

### UI コンポーネント: shadcn/ui + Base UI

**採用理由:**
- shadcn/ui はコンポーネントをプロジェクト内にコピーする方式のため、依存関係に縛られずカスタマイズが自由
- Base UI（MUI 製）はヘッドレスなアクセシブルコンポーネントを提供し、shadcn/ui でカバーしきれない部品を補完できる

**懸念点:** 2つのコンポーネントライブラリを併用するため、役割分担を明確にしないと実装がばらつく。基本は shadcn/ui を使い、Base UI は shadcn/ui にないコンポーネントに限定する運用が望ましい。

---

### features/ ディレクトリ構成

各機能は `features/{feature名}/` 配下に以下のサブディレクトリで整理する。

```
features/
└── {feature名}/
    ├── components/   # UI コンポーネント
    ├── routes/       # ページ相当のコンポーネント
    ├── hooks/        # カスタムフック（useXxx）
    ├── types/        # その feature 固有の型定義
    └── api/          # API 呼び出し関数
```


---

### フォーム: React Hook Form + Zod

**採用理由:**
- API が Hono（REST）のため、Server Actions 前提の Conform / React 19 `useActionState` の強みが活きない
- shadcn/ui の公式サンプルが RHF + Zod ベースで統一されている
- 非制御コンポーネントベースで再レンダリングが少なくパフォーマンスが良い

**不採用:**
- `useActionState`（Server Actions 前提・REST API と相性が悪い）
- Conform（同上）
