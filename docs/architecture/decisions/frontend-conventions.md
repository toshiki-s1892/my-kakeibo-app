# フロントエンド実装の規約

## データフェッチ: TanStack Query + orval

**採用理由:**
- orval が `@hono/zod-openapi` の OpenAPI スペックから React Query hooks を自動生成するため、フロントエンドのAPIクライアントを手書きする必要がない
- TanStack Query のキャッシュ・再フェッチ・ローディング状態管理により、フロントエンドの非同期処理が大幅に簡素化できる
- APIスキーマを変更したら `bun run generate` を実行するだけで型・hooksが最新化される

**運用方針:**
- orval の生成コードは `lib/api/generated/` に出力し、手書きコードと明確に分離する（手動編集禁止）
- `QueryClientProvider` は `components/provider.tsx` に `'use client'` で定義し、`app/layout.tsx` の `<body>` 内で全体を囲む
- orval設定は `mock: true` とする（Vitest導入時にMSWと組み合わせてモックサーバーとして使用する想定）

**懸念点:** APIスキーマ変更後に `bun run generate` の実行を忘れると型と実装がズレる。スキーマ変更時は必ず実行する。

## フォーム: React Hook Form + Zod

**採用理由:**
- API が Hono（REST）のため、Server Actions 前提の Conform / React 19 `useActionState` の強みが活きない
- shadcn/ui の公式サンプルが RHF + Zod ベースで統一されている
- 非制御コンポーネントベースで再レンダリングが少なくパフォーマンスが良い

**不採用:**
- `useActionState`（Server Actions 前提・REST API と相性が悪い）
- Conform（同上）

**UI定数とDB定数のマッピング設計:**

SelectコンポーネントはRadix UIを使用しており、`value` は常に `string` を扱う。一方、DBやAPIには数値コードを送信する必要があるため、フォームの `value`（string）→ APIリクエストの数値コード（number）への変換が必要になる。

この変換を型安全かつシンプルに行うため、`packages/common/src/ui-constant.ts` の `GENDER_OPTIONS` 等の `value` は対応する `GENDER_CODE`（`packages/common/src/db-code.ts`）の**キー名**（`'MALE'|'FEMALE'|'OTHER'`）に合わせて定義する。これにより、フォームの入力値をそのまま `GENDER_CODE[data.gender]` とインデックスアクセスするだけで型安全な数値変換が実現できる（`as` キャストや中間マッピングテーブルが不要）。

```ts
// packages/common/src/ui-constant.ts
export const GENDER_OPTIONS = [
  { value: 'MALE', label: '男性' },
  { value: 'FEMALE', label: '女性' },
  { value: 'OTHER', label: 'その他' },
] as const;

// 変換処理
genderCode: GENDER_CODE[data.gender], // 'MALE' → 1, 'FEMALE' → 2, 'OTHER' → 9
```

## フロントエンドのエラーハンドリング方針

**背景:**

orvalが生成する `postApiXxx` 等の関数は、`fetch` が例外をthrowしないため、HTTPステータスが400/401/500でも例外を投げず `{ data, status, headers }` を返す。そのため `useMutation` の `onError` はネットワークエラーやレスポンス解析エラー時にしか発火せず、APIのエラーレスポンスは `onSuccess` 内で `response.status` を見て分岐する必要がある。

未認証アクセスは `proxy.ts` の `clerkMiddleware` + `auth.protect()` がページ・APIルート問わず先に弾くため（セッショントークンの場合は404を返す）、Honoハンドラ内の401（`getAuth(c)`がnullのケース）にはほぼ到達しない。また `onError` で捕捉される例外は「ネットワーク切断」「404のHTMLレスポンスのJSONパース失敗」などが混在しており、フロントエンド側で「セッション切れ」と確実に判別することはできない。誤判定すると、単なる通信エラーでもサインイン画面へ強制遷移するなど混乱したUXになる。

**ステータスごとの対応方針:**

| ステータス | 対応 |
|---|---|
| 2xx（204など） | 成功処理（リダイレクトなど） |
| 400 | レスポンスの `details[].field` を `form.setError()` でフォームフィールドに反映する。APIのフィールド名とフォームのフィールド名が異なる場合はマッピングする |
| 上記以外（401・500・`onError`で捕捉した例外を含む） | `Alert`（shadcn/ui）でカード内に汎用エラーメッセージを表示する。入力中のフォーム状態を保持したままその場に表示し、再試行できるようにする |

セッションが本当に切れている場合は、ユーザーが再試行・再遷移したタイミングで `proxy.ts` が自然に `/sign-in` へ誘導するため、フォーム側で先回りしてセッション切れを判定・リダイレクトする必要はない。

**フォームを伴わない操作（削除・ピン留め切り替え・一括削除等）の失敗:**

上記の方針はフォーム送信処理（入力中の状態を保持する `Alert`）を前提にしているため、フォームカードを持たない単発アクションには適用できない。これらは例外的に **Sonner（トースト）** でエラーを表示する。操作対象（一覧の行等）は画面上にそのまま残るため、ユーザーはもう一度同じ操作をやり直せる。

**初回データ取得（GET）失敗:**

一覧・サマリー等の初回データ取得が失敗した場合は、表示すべきデータ自体が存在しないため、トーストではなく**コンテンツ部分を差し替えて**「読み込みに失敗しました」+「再試行」ボタンを表示する。

**ローディング状態:**

| 状態 | 表示 |
|---|---|
| 初回データ取得中（一覧・サマリー等） | コンテンツ部分をスケルトン表示 |
| 保存・削除等の操作中 | 操作対象のボタンをスピナー付き`disabled`状態に |

**実装パターン:**

- フォーム送信処理（変換・mutation呼び出し・ステータス分岐・リダイレクト）は `features/{feature名}/hooks/use{Feature}Form.ts` のようなカスタムフックに集約し、コンポーネントは表示に専念する
- 汎用エラーの表示にはトーストではなく `Alert` を使用する（トーストは自動的に消えるため、ユーザーの対応が必要なブロッキングエラーの表示には不向き）

**懸念点:** 機能が増えるごとに同様のステータス分岐コードが各カスタムフックに重複する可能性がある。共通化（共通エラーハンドラ関数など）の必要性は実装が増えてから再検討する。

## features/ ディレクトリ構成

各機能は `features/{feature名}/` 配下に以下のサブディレクトリで整理する。

```
features/
└── {feature名}/
    ├── components/   # UI コンポーネント
    ├── routes/       # ページ相当のコンポーネント
    ├── hooks/        # カスタムフック（useXxx）
    ├── schema/       # フォームバリデーション用Zodスキーマ（フロント専用）
    └── types/        # その feature 固有の型定義（複数ファイルをまたいで共有する型のみ）
```

APIクライアント（fetch）は orval が `lib/api/generated/` に自動生成するため、`services/` ディレクトリは不要。

**型定義の配置方針:**
- コンポーネントのprops型など、そのファイル内でのみ使う型は**コンポーネントファイルと同じファイル内**に定義する
- `types/` ディレクトリは、複数のコンポーネント・hooks・routesをまたいで参照される共有型にのみ使用する

**フォームコンポーネントの設計方針:**
- フォームUIコンポーネント（`components/` 配下）は[コンポーネントカタログページ](#コンポーネントカタログページ)での表示確認に対応するため**propsベースの表示専用コンポーネント**として実装する
- `form`（`UseFormReturn`）・`onSubmit`・`isPending`・`submitError` 等をpropsで受け取り、JSXの描画に専念する
- ビジネスロジック（フォーム生成・変換・API呼び出し・リダイレクト）は `hooks/` のカスタムフックに集約し、`routes/` のコンポーネントからフックを呼び出してpropsとして渡す

## コンポーネントカタログページ

**背景:** コンポーネントの一覧・見た目確認の手段としてStorybookの導入を検討したが、個人開発でのメンテコスト（Next.jsのメジャーバージョンアップへの追従が遅れがちな懸念）を踏まえて見送り、アプリ内に自作のカタログページを用意する方針にした（[testing-strategy.md](./testing-strategy.md)で決定したコンポーネントテスト非導入とは別の決定）。

**位置付け:** 見た目確認専用であり、テストの代替ではない（コンポーネントテストは導入しない）。

**本番環境からの除外:** 開発時のみアクセス可能にし、本番ビルドでは404を返す。実装時は `process.env.NODE_ENV === 'production'` の場合に `notFound()` を呼ぶガードを入れる。

## packages/common/src/ のファイル構成

`packages/common/src/` の定数ファイルは関心ごとに分割し、ファイル名から内容が明確にわかるように管理する。

| ファイル | 内容 |
|---|---|
| `db-code.ts` | DB保存用の数値コード（`GENDER_CODE`・`RELATIONSHIP_CODE` 等） |
| `http-status.ts` | HTTPステータス定数（`HTTP_STATUS`） |
| `ui-constant.ts` | UI表示用の定数（`GENDER_OPTIONS`・`REGION_MAP` 等） |
| `error-message.ts` | ユーザー向けエラーメッセージ文言 |

`constant.ts` という汎用名は廃止し、上記のように役割が明確な名前に分割した。新しい定数を追加する際も同様に役割ごとのファイルに配置する。

## ファイル命名規則

ディレクトリの種別に応じて以下の命名規則を適用する。

| ディレクトリ / 種別 | 命名規則 | 例 |
|---|---|---|
| `components/`（UIコンポーネント） | PascalCase | `ProfileSetupForm.tsx` |
| `features/*/routes/` | PascalCase | `ProfileSetupRoute.tsx` |
| `features/*/hooks/` | camelCase | `useProfileSetupForm.ts` |
| `features/*/schema/` | camelCase | `profileSetupFormSchema.ts` |
| `packages/common/src/` | kebab-case | `db-code.ts`・`http-status.ts` |
| `components/ui/`（shadcn生成） | kebab-case（shadcn規約に従いそのまま維持） | `alert.tsx`・`button.tsx` |

プロジェクト全体での統一より、**ディレクトリごとの慣習を一貫させること**を優先する。

## 汎用フックの配置: lib/hooks/

機能（feature）に依存しない汎用ユーティリティフックは `lib/hooks/` に配置する。

```
lib/
└── hooks/
    └── useMediaQuery.ts   # ブレークポイント判定フック
```

`features/*/hooks/` は各機能固有のフック（フォームロジック等）に限定し、複数機能をまたいで使う汎用フックは `lib/hooks/` に集約する。

## アイコン

矢印等の記号はテキスト文字（→等）ではなく`lucide-react`のSVGコンポーネントを使用する。`Button`の`[&_svg]:size-4`等のスタイリングが自動適用され、フォント依存の見た目のブレ（OS・ブラウザによる文字の太さ・位置のズレ）を避けられる。

## レスポンシブ対応: useMediaQuery パターン

スマホ／PCで異なるコンポーネントを出し分ける場合（例: Drawer vs Popover）は `lib/hooks/useMediaQuery.ts` を使用する。

```ts
const isDesktop = useMediaQuery('(min-width: 768px)');
```

**ハイドレーションミスマッチの回避:**

`useState(false)` を初期値にすることで、サーバー・クライアント両方が最初は `false`（モバイル扱い）でレンダリングし、`useEffect` 実行後に実際の画面幅に切り替わる設計にしている。これは shadcn/ui 公式の実装と同一パターンであり、Next.js App Router での推奨アプローチ。

**ブレークポイント値について:**

`768px` は Tailwind CSS v4 のデフォルトブレークポイント `md`（`--breakpoint-md: 48rem`）と一致する。このプロジェクトではブレークポイントをカスタム定義していないため、ハードコードで問題ない。カスタムブレークポイントを追加した場合は `packages/common/src/ui-constant.ts` に `BREAKPOINTS` 定数を定義して同期させること。
