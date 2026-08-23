# フロントエンド実装の規約

## データフェッチ: TanStack Query + orval

**採用理由:**

- orval が `@hono/zod-openapi` の OpenAPI スペックから React Query hooks を自動生成するため、フロントエンドのAPIクライアントを手書きする必要がない
- TanStack Query のキャッシュ・再フェッチ・ローディング状態管理により、フロントエンドの非同期処理が大幅に簡素化できる
- APIスキーマを変更したら `bun run generate` を実行するだけで型・hooksが最新化される

**運用方針:**

- orval の生成コードは `lib/api/generated/` に出力し、手書きコードと明確に分離する（手動編集禁止）
- `QueryClientProvider` は `app/providers.tsx` に `'use client'` で定義し、`app/layout.tsx` の `<body>` 内で全体を囲む（唯一の利用者が `app/layout.tsx` のためコロケーション優先で `app/` 直下に配置。`app/components/` は表示用コンポーネント専用とする。2026-07-19に `components/provider.tsx` から移動）
- orval設定は `mock: true` とする。`app/features/*/hooks/`のフックテスト（MSWと組み合わせる）で使用する。具体的な運用方針は[testing-strategy.mdのフックテストのMSWモック方針](./testing-strategy.md#フックテストのmswモック方針)を参照
- orval設定の `override.fetch.forceSuccessResponse` は使用しない（2026-08-12決定）。カスタムmutator（`customFetch`）が `!res.ok` で常にthrowするため実行時の効果を持たず、トップレベルが配列・`void`のレスポンスに対して無効な型（`CategoryWithChildren[]Success`・`voidSuccess`等、未定義の型名を参照する構文エラー・型エラー）を生成するorvalの既知バグがある（Issue #3774。Closed表記だが8.24.0でも再現を確認済み。`override.operations.<id>`によるoperation単位の無効化も効果なし）。orval公式のcustom-fetchサンプルもこのオプションを使用していない

**懸念点:** APIスキーマ変更後に `bun run generate` の実行を忘れると型と実装がズレる。スキーマ変更時は必ず実行する。

### コンポーネントpropsの型（2026-08-11決定）

APIから取得したデータを表示専用コンポーネントのpropsとして渡す場合、`lib/api/generated/models/` の生成モデル型（例: `CategoryWithChildren`）を使う。orvalが生成する`getApiXxxResponse200`等の型は `{ data, status, headers }` というfetchレスポンスの封筒であり（[エラーハンドリング方針](#フロントエンドのエラーハンドリング方針)参照）、`status`・`headers`など表示に無関係な情報まで型に含まれるため、表示コンポーネントのpropsには使わない。

生成モデル型の名前が画面での用途と合わない場合（例: `CategoryWithChildren`を一覧画面のitem型として使うが、この形状は将来的に単一カテゴリ取得・作成・更新のレスポンスでも再利用予定）、生成型自体をリネームせず、利用側のコンポーネントファイルでローカルに用途名のエイリアスを付ける。

```ts
import type { CategoryWithChildren } from '@/lib/api/generated/models';

type CategoryListItem = CategoryWithChildren;

type CategoryTableProps = {
  categories: CategoryListItem[];
};
```

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

## 選択肢定数の配置基準（2026-07-25決定）

固定の選択肢（タブ・Selectのオプション等）は`{ value, label }`の配列＋`.map()`で宣言する（`apps/web/app/(app)/nav-items.ts`の`{ href, label, icon }`配列も同パターン）。文字列リテラルを描画箇所に直書きせず、配列を1箇所にまとめることで選択肢の追加・値のtypoによるズレを防げる。

**置き場所の判断基準:** 「同一feature内の複数ファイルから参照されるか」ではなく、「他のfeatureやアプリ全体から再利用される値か」で判断する。

| 判断                                      | 置き場所                                                        | 例                                        |
| ----------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| 他featureやサーバー側からも参照されうる値 | `packages/common/src/ui-constant.ts`                            | `GENDER_OPTIONS`・`CATEGORY_TYPE_OPTIONS` |
| 特定featureの画面内でのみ意味を持つ値     | `app/features/{feature名}/`直下に、内容がわかるファイル名で配置 | `app/features/categories/categoryTab.ts`  |

feature固有の定数ファイルは`constants.ts`のような汎用名にせず、`packages/common/src/`のファイル命名方針（[packages/common/src/ のファイル構成](#packagescommonsrc-のファイル構成)参照）と同様に、中身がわかる名前にする。

**`value`の命名規則:** 対応するドメイン定数（`packages/common/src/db-constants.ts`の`CATEGORY_TYPE`等）が存在する値は、そのキー名の大文字表記に合わせる（`GENDER_OPTIONS`の`value`が`GENDER_CODE`のキー名に合わせているのと同じ考え方）。対応するドメイン定数が存在しない、feature内限定のUI状態（画面内のタブ切り替え等）はcamelCaseにする。

## アイコンライブラリの動的解決パターン（2026-08-15決定）

DBやフォームの選択値として文字列キー（例: `categories.icon`に保存する`lucide-react`のアイコン名）を持ち、そのキーから対応するアイコンコンポーネントを実行時に解決したい場面がある。

`import * as Icons from 'lucide-react'; Icons[iconName]`のような動的アクセスは避ける。`lucide-react`は1000種類以上のアイコンをexportしており、この書き方だとバンドラのtree-shakingが効かず、実際に使うアイコン数に関わらずパッケージ全体がバンドルに含まれてしまう。

代わりに、使用するアイコンだけを明示的にimportした`Record`型の対応表を1箇所に作り、そこ経由でキー→コンポーネントを解決する。

```ts
import { Utensils, Train, Home /* ... */ } from 'lucide-react';
import { CATEGORY_ICON_CODE, type CategoryIconCode } from '@repo/common';

export const CATEGORY_ICON_COMPONENT: Record<CategoryIconCode, LucideIcon> = {
  [CATEGORY_ICON_CODE.UTENSILS]: Utensils,
  [CATEGORY_ICON_CODE.TRAIN]: Train,
  [CATEGORY_ICON_CODE.HOME]: Home,
  // ...
};
```

この対応表はフロントエンド専用の表示ロジックのため、DBスキーマ・zod検証を持つ`packages/common`ではなく`apps/web`側に置く。アイコン以外でも同様の「文字列キー→アセット/コンポーネント」変換が必要になった場合はこのパターンに従う。

## Zodエラーメッセージの日本語化（グローバルロケール設定）

**背景:** バリデーションメッセージは`packages/common/src/error-message.ts`の定数・関数をスキーマに配線しているが、配線し忘れた箇所やカスタムエラー関数が`undefined`を返す分岐（enum外の値等）ではZodの英語デフォルト文言にフォールバックしてしまう。フィールドごとに穴を塞いで回る方式では書き漏らしリスクが残り続けるため、横断的関心事としてグローバルに解決する。

**採用（2026-07-13）:** Zod 4同梱の公式日本語ロケールをアプリ初期化時に1回設定する。

```ts
// lib/zod-locale.ts
import z from 'zod';

z.config(z.locales.ja());
```

- クライアント側入口（`app/providers.tsx`）とサーバー側入口（`app/api/[...route]/route.ts`）の先頭で副作用import（`import '@/lib/zod-locale';`）する。Next.jsではクライアントとサーバーが別バンドルのため**両方の入口で必要**。新しい入口（別レイアウト直下のClient Component等）を作る場合も同様
- スキーマに配線した自前メッセージ（`requiredMessage`等）はロケールより常に優先されるため、既存の挙動には影響しない。役割分担は「自前で文言を決めたい箇所＝カスタムメッセージ、書き漏らし・想定外の箇所＝日本語ロケールがフォールバック」の二段構え
- 共有パッケージ（`packages/common`）の読み込み副作用に仕込む方式は「importしただけで全体設定が変わる」暗黙の魔法になるため不採用
- vitestはアプリの入口を通らないため、テスト実行時はロケール未適用（英語デフォルト）になる。テストがZodデフォルト文言を検証しない方針（[testing-strategy.md](./testing-strategy.md#各層の検証責務重複を避ける)参照）のため問題にならない

## フロントエンドのエラーハンドリング方針

**背景（2026-08-23更新: throwベースの契約に変更）:**

orvalの`mutator`に独自の`customFetch`（[lib/api/custom-fetch.ts](../../../apps/web/lib/api/custom-fetch.ts)）を指定しており、`res.ok`が`false`の場合は`ApiError`（`status`・`body`を持つ）を`throw`する。あわせて`orval.config.ts`の`fetch.includeHttpResponseReturnType`を`false`にしているため、成功時のレスポンスは`{ data, status, headers }`の封筒ではなく中身（`data`相当）のみが返る。そのため**成功は`onSuccess`、HTTPエラー（400/401/409/500等）とネットワーク・パースエラーはすべて`onError`**で扱う。`onSuccess`側では`response.status`は参照できない。

`onError`で受け取る`error`は「APIがエラーステータスを返した`ApiError`」と「ネットワーク切断等の素の`Error`」が混在するため、`error instanceof ApiError`でステータスを持つ場合とそうでない場合を判定してから分岐する。

未認証アクセスは `proxy.ts` の `clerkMiddleware` + `auth.protect()` がページ・APIルート問わず先に弾くため（セッショントークンの場合は404を返す）、Honoハンドラ内の401（`getAuth(c)`がnullのケース）にはほぼ到達しない。また`ApiError`にならない例外（ネットワーク切断・JSONパース失敗等）も混在しており、フロントエンド側で「セッション切れ」と確実に判別することはできない。誤判定すると、単なる通信エラーでもサインイン画面へ強制遷移するなど混乱したUXになる。

**ステータスごとの対応方針:**

| ケース                                                     | コールバック | 対応                                                                                                                                                     |
| ---------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2xx（204など）                                             | `onSuccess`  | 成功処理（リダイレクトなど）                                                                                                                             |
| 400（`error instanceof ApiError && error.status === 400`） | `onError`    | `error.body?.details[].field` を `form.setError()` でフォームフィールドに反映する。APIのフィールド名とフォームのフィールド名が異なる場合はマッピングする |
| 上記以外（401・409・500・`ApiError`でない例外を含む）      | `onError`    | `Alert`（shadcn/ui）でカード内に汎用エラーメッセージを表示する。入力中のフォーム状態を保持したままその場に表示し、再試行できるようにする                 |

セッションが本当に切れている場合は、ユーザーが再試行・再遷移したタイミングで `proxy.ts` が自然に `/sign-in` へ誘導するため、フォーム側で先回りしてセッション切れを判定・リダイレクトする必要はない。

**フォームを伴わない操作（削除・ピン留め切り替え・一括削除等）の失敗:**

上記の方針はフォーム送信処理（入力中の状態を保持する `Alert`）を前提にしているため、フォームカードを持たない単発アクションには適用できない。これらは例外的に **Sonner（トースト）** でエラーを表示する。操作対象（一覧の行等）は画面上にそのまま残るため、ユーザーはもう一度同じ操作をやり直せる。

**初回データ取得（GET）失敗:**

一覧・サマリー等の初回データ取得が失敗した場合は、表示すべきデータ自体が存在しないため、トーストではなく**コンテンツ部分を差し替えて**「読み込みに失敗しました」+「再試行」ボタンを表示する。

**ローディング状態:**

| 状態                                 | 表示                                           |
| ------------------------------------ | ---------------------------------------------- |
| 初回データ取得中（一覧・サマリー等） | コンテンツ部分をスケルトン表示                 |
| 保存・削除等の操作中                 | 操作対象のボタンをスピナー付き`disabled`状態に |

**実装パターン:**

- フォーム送信処理（変換・mutation呼び出し・ステータス分岐・リダイレクト）は `app/features/{feature名}/hooks/use{Feature}Form.ts` のようなカスタムフックに集約し、コンポーネントは表示に専念する
- 汎用エラーの表示にはトーストではなく `Alert` を使用する（トーストは自動的に消えるため、ユーザーの対応が必要なブロッキングエラーの表示には不向き）

**初回データ取得（GET）のスケルトン/エラー出し分け: `QueryBoundary`（2026-08-23決定）**

「初回取得中はスケルトン」「失敗時はコンテンツ差し替え+再試行ボタン」という上記の出し分けは、一覧・サマリー系のGETエンドポイントを持つ画面（取引一覧・ダッシュボードのカテゴリ別グラフ・家族構成一覧等）で共通のため、`app/components/QueryBoundary.tsx` に切り出す。`isPending`・`error`・`onRetry`・`skeleton`（画面ごとに異なるスケルトンのJSX）・`children`（成功時に表示する内容）をpropsで受け取り、3状態（pending/error/成功）を排他的に出し分ける。

```tsx
<QueryBoundary
  isPending={categories.isPending}
  error={categories.error}
  onRetry={() => categories.refetch()}
  skeleton={<Skeleton className="h-14 w-full" />}
>
  {/* 成功時に表示する内容 */}
</QueryBoundary>
```

出し分けの内容自体（3状態の分岐ロジックとAlert+再試行ボタンの文言）は`QueryBoundary`内に集約し、画面側は「スケルトンの見た目」と「成功時の中身」だけを渡す。初回実装（`categories`一覧）は[categories/list.md](../../design/categories/list.md)参照。

**懸念点:** 機能が増えるごとに同様のステータス分岐コードが各カスタムフックに重複する可能性がある。共通化（共通エラーハンドラ関数など）の必要性は実装が増えてから再検討する。

## app/features/ ディレクトリ構成

**`app/` 配下への集約（2026-08-23決定）:** `components/`・`features/`はNext.js App Routerの[コロケーション](https://nextjs.org/docs/app/getting-started/project-structure#colocation)機能を使い、`apps/web/`直下ではなく`app/`配下に置く。App Routerは予約されたファイル名（`page.tsx`・`layout.tsx`・`route.ts`等）のみをルートとして扱うため、`app/`配下にそれ以外のディレクトリ（`components/`・`features/`）を置いてもルーティングに影響しない。`app/`の外に`components/`・`features/`を独立させると、「ルーティングのapp/」と「UIコードのcomponents・features」が別々のトップレベルディレクトリとして並び関係が見えにくくなるため、`app/`直下にまとめてアプリのUI関連コードの所在を一箇所に集約する。

各機能は `app/features/{feature名}/` 配下に以下のサブディレクトリで整理する。

```
app/features/
└── {feature名}/
    ├── components/   # UI コンポーネント
    ├── routes/       # ページ相当のコンポーネント
    ├── hooks/        # カスタムフック（useXxx）。テストは`__tests__/`配下に置く
    ├── schema/       # フォームバリデーション用Zodスキーマ（フロント専用）。テストは`__tests__/`配下に置く
    └── types/        # その feature 固有の型定義（複数ファイルをまたいで共有する型のみ）
```

テストファイルの配置規約（`__tests__`サブディレクトリ）の詳細は[testing-strategy.md](./testing-strategy.md#テストファイルの配置規約__testsサブディレクトリ)を参照。

APIクライアント（fetch）は orval が `lib/api/generated/` に自動生成するため、`services/` ディレクトリは不要。

**1画面に複数ドメインが混在する場合（2026-07-25決定）:** featureは画面（route）単位を維持し、1画面に複数のドメイン概念が含まれる場合もfeatureを分割しない。ドメインごとの見通しは`components/`・`hooks/`・`schema/`配下にドメイン名のサブディレクトリを切ることで確保する。

例: カテゴリ管理画面（`/categories`）は「カテゴリ」「取引先」の2ドメインを1画面のタブで扱うが、`app/features/transaction-parties/`のような専用画面を持たないfeatureを新設せず、`app/features/categories/`配下に集約する。

```
app/features/categories/
├── categoryTab.ts             # feature固有の定数（親タブの値）
├── components/
│   ├── CategoryTransactionPartyTabs.tsx
│   ├── category/              # カテゴリドメインのコンポーネント
│   └── transaction-party/     # 取引先ドメインのコンポーネント
├── hooks/
│   ├── useCreateCategory.ts
│   └── useCreateTransactionParty.ts
├── schema/
│   ├── categoryFormSchema.ts
│   └── transactionPartyFormSchema.ts
└── routes/
    └── CategoriesRoute.tsx
```

判断基準: そのドメインが独立した画面（route）を持つなら別feature、持たないなら既存featureの中でドメイン別サブディレクトリに分ける。

**型定義の配置方針:**

- コンポーネントのprops型など、そのファイル内でのみ使う型は**コンポーネントファイルと同じファイル内**に定義する
- `types/` ディレクトリは、複数のコンポーネント・hooks・routesをまたいで参照される共有型にのみ使用する

**フォームコンポーネントの設計方針:**

- フォームUIコンポーネント（`app/components/` 配下）は[コンポーネントカタログページ](#コンポーネントカタログページ)での表示確認に対応するため**propsベースの表示専用コンポーネント**として実装する
- `form`（`UseFormReturn`）・`onSubmit`・`isPending`・`submitError` 等をpropsで受け取り、JSXの描画に専念する
- ビジネスロジック（フォーム生成・変換・API呼び出し・リダイレクト）は `hooks/` のカスタムフックに集約し、`routes/` のコンポーネントからフックを呼び出してpropsとして渡す

## コンポーネントカタログページ

**背景:** コンポーネントの一覧・見た目確認の手段としてStorybookの導入を検討したが、個人開発でのメンテコスト（Next.jsのメジャーバージョンアップへの追従が遅れがちな懸念）を踏まえて見送り、アプリ内に自作のカタログページを用意する方針にした（[testing-strategy.md](./testing-strategy.md)で決定したコンポーネントテスト非導入とは別の決定）。

**位置付け:** 見た目確認専用であり、テストの代替ではない（コンポーネントテストは導入しない）。

**本番環境からの除外:** 開発時のみアクセス可能にし、本番ビルドでは404を返す。実装時は `process.env.NODE_ENV === 'production'` の場合に `notFound()` を呼ぶガードを入れる。

## packages/common/src/ のファイル構成

`packages/common/src/` の定数ファイルは関心ごとに分割し、ファイル名から内容が明確にわかるように管理する。

| ファイル           | 内容                                                          |
| ------------------ | ------------------------------------------------------------- |
| `db-code.ts`       | DB保存用の数値コード（`GENDER_CODE`・`RELATIONSHIP_CODE` 等） |
| `http-status.ts`   | HTTPステータス定数（`HTTP_STATUS`）                           |
| `ui-constant.ts`   | UI表示用の定数（`GENDER_OPTIONS`・`REGION_MAP` 等）           |
| `error-message.ts` | ユーザー向けエラーメッセージ文言                              |

`constant.ts` という汎用名は廃止し、上記のように役割が明確な名前に分割した。新しい定数を追加する際も同様に役割ごとのファイルに配置する。

## ファイル命名規則

ディレクトリの種別に応じて以下の命名規則を適用する。

| ディレクトリ / 種別                   | 命名規則                                   | 例                             |
| ------------------------------------- | ------------------------------------------ | ------------------------------ |
| `app/components/`（UIコンポーネント） | PascalCase                                 | `ProfileSetupForm.tsx`         |
| `app/features/*/routes/`              | PascalCase                                 | `ProfileSetupRoute.tsx`        |
| `app/features/*/hooks/`               | camelCase                                  | `useProfileSetupForm.ts`       |
| `app/features/*/schema/`              | camelCase                                  | `profileSetupFormSchema.ts`    |
| `packages/common/src/`                | kebab-case                                 | `db-code.ts`・`http-status.ts` |
| `app/components/ui/`（shadcn生成）    | kebab-case（shadcn規約に従いそのまま維持） | `alert.tsx`・`button.tsx`      |

プロジェクト全体での統一より、**ディレクトリごとの慣習を一貫させること**を優先する。

## 汎用フックの配置: lib/hooks/

機能（feature）に依存しない汎用ユーティリティフックは `lib/hooks/` に配置する。

```
lib/
└── hooks/
    └── useMediaQuery.ts   # ブレークポイント判定フック
```

`app/features/*/hooks/` は各機能固有のフック（フォームロジック等）に限定し、複数機能をまたいで使う汎用フックは `lib/hooks/` に集約する。

## アイコン

矢印等の記号はテキスト文字（→等）ではなく`lucide-react`のSVGコンポーネントを使用する。`Button`の`[&_svg]:size-4`等のスタイリングが自動適用され、フォント依存の見た目のブレ（OS・ブラウザによる文字の太さ・位置のズレ）を避けられる。

**lucide-reactにない独自アイコン（2026-07-25決定）:**

下部固定ナビゲーション等、Stitchモックアップの見た目（Material Symbols系）に`lucide-react`で一致するアイコンがない場合は、SVGRでSVGをReactコンポーネント化して使用する。

- SVGファイルは`public/icon/*.svg`に配置し、`fill="currentColor"`にする（色をCSSの`color`から制御するため）
- `import Icon from '@/public/icon/xxx.svg';`（`?url`なし）で直接importするとSVGRが変換したReactコンポーネントになり、`<Icon className="text-white" />`のようにJSXタグとして使える
- `next/image`で画像として使いたい場合（ロゴ等）は`?url`を付けてimportする（`import logo from '@/public/icon/logo.svg?url';`）。この場合は従来通りURL文字列が返る
- 中身のないパススルーだけの中継コンポーネント（`export { default as XxxIcon } from '...'`のみのファイル）は作らず、使用箇所で直接importする。ラップする価値がある場合（背景色・サイズ等の実際のスタイリングを持つ場合）のみ`app/components/icons/`にコンポーネントを作る（例: [LogoIcon.tsx](../../../apps/web/app/components/icons/LogoIcon.tsx)）

**Next.js 16のTurbopackでの設定:**

Next.js 16はデフォルトでTurbopackを使うため、`next.config.ts`の`webpack()`関数オプションは無視される（`webpack`設定があるとビルドエラーになる）。SVGR等のwebpackローダーを使う場合は`turbopack.rules`で設定する。

```ts
// apps/web/next.config.ts
turbopack: {
  rules: {
    '*.svg': [
      { condition: { query: /url/ }, type: 'asset' }, // *.svg?url → URL文字列
      { condition: { not: { query: /url/ } }, loaders: ['@svgr/webpack'], as: '*.js' }, // それ以外 → SVGRでコンポーネント化
    ],
  },
},
```

型定義は`apps/web/svgr.d.ts`に`declare module '*.svg'`・`declare module '*.svg?url'`を用意する（詳細は[stack.mdのNext.js 16懸念点](./stack.md#フレームワーク-nextjs-16-app-router--react-19)参照）。

## レスポンシブ対応: useMediaQuery パターン

スマホ／PCで異なるコンポーネントを出し分ける場合（例: Drawer vs Popover）は `lib/hooks/useMediaQuery.ts` を使用する。

```ts
const isDesktop = useMediaQuery('(min-width: 768px)');
```

**ハイドレーションミスマッチの回避:**

`useState(false)` を初期値にすることで、サーバー・クライアント両方が最初は `false`（モバイル扱い）でレンダリングし、`useEffect` 実行後に実際の画面幅に切り替わる設計にしている。これは shadcn/ui 公式の実装と同一パターンであり、Next.js App Router での推奨アプローチ。

**ブレークポイント値について:**

`768px` は Tailwind CSS v4 のデフォルトブレークポイント `md`（`--breakpoint-md: 48rem`）と一致する。このプロジェクトではブレークポイントをカスタム定義していないため、ハードコードで問題ない。カスタムブレークポイントを追加した場合は `packages/common/src/ui-constant.ts` に `BREAKPOINTS` 定数を定義して同期させること。

**Tailwindのレスポンシブprefixも`md:`に統一する（2026-07-25決定）:** CSSのレスポンシブ切り替え（`sm:`/`md:`等）は、`useMediaQuery`の768px（`md`）と同じ基準に揃える。`sm:`（640px）を使うと、画面幅640〜768pxの範囲で「見た目はPC版に切り替わっているのに、`useMediaQuery`ベースで出し分けているコンポーネント（[BirthdayPicker.tsx](../../../apps/web/components/BirthdayPicker.tsx)のDrawer/Popover等）はまだSP版のまま」という中間状態が発生するため。

**構造が同じで見た目だけを変える場合はCSSのみで完結させる（2026-07-25決定）:** `useMediaQuery`はPC/SPで**別コンポーネント**を出し分ける場合（Drawer vs Popover等、構造そのものが異なるケース）に限定する。同じコンポーネントの見た目（バリアント）だけをPC/SPで変える場合は、JS側の判定を挟まず、対象を2つ並べて`md:hidden`／`hidden md:flex`で表示・非表示を切り替える。

```tsx
{
  /* SP: ピル型 */
}
<TabsList variant="default" className="md:hidden">
  ...
</TabsList>;

{
  /* PC: 下線型 */
}
<TabsList variant="line" className="hidden md:flex">
  ...
</TabsList>;
```

DOM上は両方存在するが非表示側は`display: none`になるだけなので、JS判定なしに切り替わり、`Tabs`のルートで状態（`value`）を共有できる。

## デフォルトの文字サイズ（PC/SP、2026-07-25決定）

`apps/web/app/globals.css`の`@layer base`で、`body`にデフォルトの文字サイズを指定する。

```css
body {
  @apply text-foreground text-sm md:text-base;
  /* ... */
}
```

- SP: `text-sm`（14px）、PC（`md:`以上）: `text-base`（16px）
- 個別コンポーネントが独自の`text-*`クラスを指定している場合はそちらが優先される（`body`のデフォルトは、明示的に指定していない要素にのみ継承される）
- 背景: 都度アドホックに`text-[10px] sm:text-lg`のようなサイズを決めていくと、画面が増えるたびにサイズがばらつく（実例: フッターのラベルがPC版タブ見出しより大きく太くなっていた）。個別に必要な用途固有サイズ（例: 下部ナビの補助ラベルは`text-[10px] md:text-base`）はコンポーネント側で明示的に上書きする

## HTMLセマンティクス（2026-07-24決定）

`div`で全て組むのではなく、意味に対応するHTML要素・見出しレベルを使う。判断に迷った際は[MDNの`<main>`リファレンス](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/main)等の一次情報を確認すること。

- **`<main>`は`(app)/layout.tsx`に1箇所だけ配置する**。`{children}`（各画面のRouteコンポーネント）を`<main>`で囲むのは共通レイアウトの責務とし、各`*Route.tsx`側では書かない。「1ページに`hidden`なしの`<main>`は1つまで」というHTML仕様上の制約があるため、画面ごとのコンポーネントに重複して書くと将来の書き忘れ・二重化のリスクになる
- **ページタイトルは`h1`**: `Header`コンポーネントが`usePathname()`から算出して表示する画面タイトル（例:「カテゴリ管理」）は、そのページ唯一の主見出しなので`h1`でマークアップする。`main`の外（`header`内）にあっても問題ない
- **画面内の見出しは`h2`以降**: 一覧のセクション見出し等、画面内の小見出しは`h1`と重複させず`h2`から使う
- 上記以外（`nav`・`footer`等）も、実装する画面パーツが該当する場合は`div`ではなく意味の合う要素を優先する（例: 下部固定ナビゲーションは`nav`、フォームのバリデーションエラーメッセージ表示は`role="alert"`など）

## アクセシビリティLintの導入（2026-08-23決定）

`eslint-plugin-jsx-a11y`を`packages/eslint-config/next.js`に導入済み（`jsxA11y.flatConfigs.recommended`）。alt属性なし画像・aria属性の誤用等を機械的に検知する。上記HTMLセマンティクス規約の一部を自動チェックで補完する位置づけ。

shadcn/ui生成コンポーネント（`app/components/ui/`配下）は汎用ラッパーのため、`label-has-associated-control`等が誤検知することがある。個別に`eslint-disable-next-line`で対応するか、実際の使用箇所で問題ないか確認すること。
