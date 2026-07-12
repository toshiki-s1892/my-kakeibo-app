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
2. Playwright（E2E） — サインイン・ダッシュボードを含む主要フローが一通り繋がったタイミングで着手する（デザイン未確定・未実装の画面に対してE2Eを先に書くと、変更のたびに書き直しになるため）

**テストの粒度:**

| 層                                     | 対象                                                                                         | DB                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 単体（Vitest, node環境）               | `packages/common`の純粋ロジック（メッセージ生成関数等）                                      | 使わない                                  |
| 単体（Vitest, node環境）               | `features/*/schema/*FormSchema.ts`等のzodスキーマ（バリデーション分岐）                      | 使わない                                  |
| 単体（Vitest, jsdom環境）              | `features/*/hooks/use{Feature}Form.ts`等のフックロジック（ステータス分岐・リダイレクト判断） | 使わない（orval mock + MSWでAPIをモック） |
| 結合（Vitest + Honoの`app.request()`） | `server/routes/{feature名}/handler.ts`（APIエンドポイント単位）                              | 使う（ローカルSQLite）                    |
| E2E（Playwright）                      | 複数画面をまたぐ主要フロー                                                                   | 使う（ローカルSQLite）                    |

E2Eは最初から全分岐を網羅せず、正常系（ゴールデンパス）1本（例: サインイン→プロフィールセットアップ→ダッシュボード遷移）から開始する。異常系・バリデーションエラーなどの分岐は単体テストでカバーする。

**E2Eテスト対象フロー一覧:**

| テストファイル                         | カバーするフロー                                                 |
| -------------------------------------- | ---------------------------------------------------------------- |
| `onboarding.spec.ts`                   | サインイン → プロフィール設定 → ダッシュボード遷移               |
| `transactions.spec.ts`                 | 取引登録（複数行） → 一覧に反映 → ダッシュボードのサマリーに反映 |
| `transactions-bulk.spec.ts`            | 一覧で複数選択 → 一括削除（確認ダイアログ → 反映）               |
| `transactions-inline-category.spec.ts` | 取引登録フォームで新規カテゴリをインライン遅延作成 → 登録に反映  |
| `transactions-inline-party.spec.ts`    | 取引登録フォームで新規取引先をインライン遅延作成 → 登録に反映    |
| `recurring-transactions.spec.ts`       | 定期取引テンプレート登録 → 定期取引タブ一覧に反映                |
| `categories-pin-dashboard.spec.ts`     | カテゴリのピン留め操作 → ダッシュボード円グラフに反映            |
| `family-members-default.spec.ts`       | デフォルトメンバー変更 → 取引登録フォームの初期選択に反映        |
| `ai-receipt-scan.spec.ts`              | レシート画像選択 → フォームに自動下書き → 内容確認して登録       |
| `ai-advice.spec.ts`                    | アドバイス画面でトピック選択 → SSEで回答が逐次表示される         |

E2Eの対象外（単体・結合テストで担保）: カテゴリ追加/編集（Dialog内で完結）、家族メンバー追加/編集（Dialog内で完結）、取引先の管理画面での追加/編集/削除、各フォームのバリデーションエラー表示。

**Playwrightの設定方針:**

- テストファイルの配置: `apps/web/e2e/`（Vitestと同じく各パッケージが個別に持つ方針に従い、ルート直下には置かない）
- 対象ブラウザ: Desktop Chrome・Pixel 7（Android）・iPhone 14（iOS）の3つ。設計書にPC版・SP版両方のモックアップが定義されているため、最初から両方を対象にする
- セットアップ: `bun create playwright` は内部でnpmをハードコードしているためBunのワークスペースで失敗する。`bun add -d @playwright/test` + `bunx playwright install` で手動セットアップする
- ポート設定: devサーバーは3001で起動する（`next dev --port 3001`）ため、`baseURL`・`webServer.port`とも**3001**に揃える。`webServer.port`が実ポートとずれていると、サーバー起動を待ち続けて60秒タイムアウトで失敗する（CI導入時に実際に発生した）

**各層の検証責務（重複を避ける）:**

層を分けても「同じ分岐を複数層で重複してテストする」と保守コストが増えるだけなので、各層が検証する内容を以下のように分担する。

| 層                             | 検証する責務                                                                               | 検証しないこと                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `common`（メッセージ生成関数） | 関数が**正しい文言**を生成するか（期待値はハードコードした文字列で比較する）               | どの画面・どのフィールドで使われるか             |
| `schema`（zodスキーマ）        | 入力値に対して**どのフィールドがエラーになるか／ならないか**（バリデーションルールの分岐） | エラー文の文言の正しさ（`common`で担保済み）     |
| `hooks`                        | **APIレスポンス（成功/400/500等）に応じた分岐・画面遷移・state更新**                       | バリデーションルールの分岐（`schema`で担保済み） |
| `server`（結合）               | APIエンドポイント単位の入出力（リクエスト→DB→レスポンス、ステータスコード）                | フロント側のフォームの挙動                       |
| `e2e`                          | 画面をまたいだ遷移・結合動作（正常系1本から開始）                                          | 各層の異常系の網羅（単体テストで担保済み）       |

特に`schema`のテストで期待値を作る際、検証対象と同じメッセージ生成関数を呼んで期待値を作ると（例: `expect(issue.message).toBe(maxLengthMessage(50))`）、関数の戻り値同士を比較するだけの自明な検証になり、文言が実際に正しいかは検証できない。文言の正しさは`common`のテストでハードコード文字列と比較して担保し、`schema`のテストでは「正しいフィールド・正しい条件でエラーになるか」という構造面の検証に留める。

**モノレポでのテスト実行構成（パッケージ単位、ルート集約はしない）:**

`vitest`・`vitest.config.ts`は`build`/`lint`/`check-types`と同じ流儀で、**各ワークスペースパッケージ（`apps/web`・`packages/common`）が個別に持つ**（ルートの`package.json`に`vitest`を1つだけ入れて全パッケージを横断的にincludeする集約構成は採用しない）。

- `apps/web`: `vitest`を`devDependencies`に持ち、`apps/web/vitest.config.ts`で後述の`server`・`hooks`・`schema`プロジェクトを定義する
- `packages/common`: `vitest`を別途`devDependencies`に持ち、`packages/common/vitest.config.ts`で単体テストを定義する（`apps/web`の`vitest`はworkspace間で共有されないため）

採用理由は、既存の`turbo.json`の`build`/`lint`/`check-types`タスク（`dependsOn: ["^build"]`等でパッケージごとに実行）と一貫性を保つことで、turboのキャッシュ・並列実行の恩恵（変更の無いパッケージのテストをスキップする等）を`test`タスクでも将来そのまま受けられるようにするため。

**`turbo.json`の`test`タスクに`dependsOn`は付けない:** `packages/common`は現状ビルド不要なパッケージ（`package.json`の`main`が`./src/index.ts`を直接指す、いわゆるJust-in-Time Package）であり、`apps/web`が`common`のビルド成果物に依存する物理的な関係が無いため、`dependsOn: ["^test"]`を付ける必要性は薄い（付けない場合、`apps/web`と`packages/common`のテストは並列実行される）。

**`build`タスクと`test`タスクはturboの`dependsOn`で結合しない:** 「ビルドの前にテストを通す」はCIの責務として[dev-workflow.md](./dev-workflow.md)側でコマンドを並べて実行する形で担保し、`build`タスク自体の責務（ビルドすること）に混在させない。

**Vitestの実行環境構成（`projects`機能）:**

上記の通り環境（node/jsdom）・前処理（Clerkモック・SQLite migrate・MSWセットアップ）が層ごとに異なるため、`apps/web/vitest.config.ts`内でVitestの`projects`機能（モノレポ・複数環境向けの標準構成）を使い、`server`・`hooks`・`schema`の3プロジェクトに分割する。1つの`vitest.config.ts`に環境分岐ロジックを埋め込む方法は取らない。`packages/common`は別パッケージのため、この`projects`には含めず独立した`vitest.config.ts`を持つ。

| project  | environment | 用途・setupFiles                                              |
| -------- | ----------- | ------------------------------------------------------------- |
| `server` | `node`      | `server/routes`の結合テスト（Clerkモック・SQLite migrate）    |
| `hooks`  | `jsdom`     | `features/*/hooks/`のフックテスト（MSWの`server.listen()`等） |
| `schema` | `node`      | `features/*/schema/`のバリデーション分岐テスト（DOM不要）     |

**テストファイルの配置規約（`__tests__`サブディレクトリ）:**

テストファイルは対象ファイルと同じディレクトリ直下に`__tests__/`を作り、その中に置く（feature直下に1つの`__tests__`へ集約する方式は不採用）。

```
features/profile-setup/
├── hooks/
│   ├── useProfileSetupForm.ts
│   └── __tests__/useProfileSetupForm.test.ts
└── schema/
    ├── profileSetupFormSchema.ts
    └── __tests__/profileSetupFormSchema.test.ts

packages/common/src/
├── error-message.ts
└── __tests__/error-message.test.ts
```

サブディレクトリごとに分ける理由は、`projects`の`include`をディレクトリ単位（`features/*/hooks/__tests__/*.test.ts`等）で機械的に指定できるため。feature直下にまとめる方式だと、`hooks`用・`schema`用のテストを`include`で振り分ける際にファイル名の命名規則（`use*.test.ts`か`*FormSchema.test.ts`か）に依存することになり、命名を誤ると意図しないprojectに紛れ込むリスクがある。

**テストの記述規約（2026-07-12決定、`packages/common/src/__tests__/error-message.test.ts`が最初の適用例）:**

- `describe`にはコード上の識別子（関数名・スキーマ名）を**英語のまま**書く（`describe('minLengthMessage', ...)`）。翻訳や`Tests`のような接尾辞は付けない。実行結果からコードへ検索で辿れることを優先する
- ファイル全体を括る外側の`describe`は作らない。vitestの実行結果にはファイルパスが必ず表示されるため冗長になる。実行結果が「ファイルパス > 関数名 > 振る舞い」の3階層で読める形にする
- テスト名（`test`の第1引数）は**日本語で振る舞いを記述**する（「渡した最小文字数を含むメッセージを返す」）。テストは仕様書として読まれるため、失敗時にコードを読まなくても何が壊れたか分かる名前にする。ケースが複数ある場合は「〜なら〜になる」と入力条件まで含める
- `it`ではなく`test`に統一する（両者は同機能のエイリアス。日本語テスト名では`it`の英文調の利点が薄く、vitest公式の主表記が`test`のため）
- `describe`/`test`/`expect`はvitestから**明示的にimport**する（`globals: true`は使わない。依存が追いやすく、tsconfigへの型追加も不要）
- テスト名はその層の責務に合わせる。例えば`common`のメッセージ生成関数のテストは関数の入出力の契約（「渡した◯◯を含むメッセージを返す」）を書き、「入力時に表示されるメッセージ」のような呼び出し側（スキーマ・フォーム）の責務は書かない（その振る舞いは`schema`層のテスト名に書く）

**定数はテストしない:** `expect(requiredMessage).toBe('必須項目です')`のような文字列定数そのものの検証は、実装の値を鏡写しにしただけの「change-detector test」（[Google Testing Blog](https://testing.googleblog.com/2015/01/testing-on-toilet-change-detector-tests.html)）であり、バグを捕まえられないのに変更のたびに直すコストだけが残るため書かない。テスト対象は引数から値を組み立てる関数・分岐や変換ロジックを持つ関数に限る。

**`apps/web/vitest.config.ts`の実装:**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // tsconfig.jsonの`@/...`パスエイリアスを解決する
  },
  test: {
    passWithNoTests: true, // テストファイルが0件でもエラーにしない（実装が進むまでの暫定措置）
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/routes/**/__tests__/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'hooks',
          environment: 'jsdom',
          include: ['features/*/hooks/__tests__/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'schema',
          environment: 'node',
          include: ['features/*/schema/__tests__/*.test.ts'],
        },
      },
    ],
  },
});
```

`resolve.tsconfigPaths: true`はViteがネイティブに提供する`tsconfig.json`の`paths`解決機能（Vite公式ドキュメントにも記載）で、これを使うことで`vite-tsconfig-paths`という別パッケージの追加が不要になる（以前はこのパッケージを使う想定だったが、現在のVite/Vitestのバージョンではプラグインが無くても動作することを確認したため不採用とした）。

`packages/common/vitest.config.ts`にも同様に`passWithNoTests: true`を設定する（パスエイリアスを使っていないため`resolve.tsconfigPaths`は不要）。

**フックテストのMSWモック方針:**

orvalの`mock: true`設定により`lib/api/generated/{feature}/{feature}.msw.ts`が生成されるが、これは**成功レスポンスのみ**（`overrideResponse`を渡してもステータスコードは変わらない）。そのため:

- 成功パス（2xx）: orval生成の`get{Feature}Mock()`をグローバルセットアップで登録し、そのまま使う
- 異常系（400/401/500等）: orval生成コードでは表現できないため、テストごとに`server.use(http.post('*/api/xxx', () => HttpResponse.json({...}, { status: 400 })))`のように生のMSWハンドラを個別に書く。テスト数が少ない段階では共通化せず、各テストファイルに直接記述する（重複が3件以上になった時点で共通化を検討する）

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

**結合テストのDB分離（テストケース単位）:**

`:memory:`DBの生成・migrate()コストは低いため、**`beforeEach`ごとに新規`:memory:`DBを作り直す**（テストファイル単位で1つのDBを共有して手動クリーンアップする方式は、将来テーブルが増えた際にクリーンアップ漏れで他のテストに影響するリスクがあるため避ける）。

**結合テストのClerk認証モック:**

Clerk公式も「サードパーティライブラリの内部実装に対する結合テストは書かない」ことを推奨しているため、`@clerk/hono`モジュール自体を`vi.mock()`で丸ごとモックする（`clerkMiddleware()`は`app.use('/profile/*', clerkMiddleware())`で実際にマウントされているため、`getAuth`だけでなく`clerkMiddleware`もモックが必要）。

```ts
const { mockUserId } = vi.hoisted(() => ({ mockUserId: { current: 'test-user-id' } }));

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (c: Context, next: Next) => {
    c.set('clerkAuth', { userId: mockUserId.current });
    await next();
  },
  getAuth: (c: Context) => c.get('clerkAuth'),
}));
```

`vi.hoisted()`で保持した変数をテストごとに書き換えることで、複数ユーザーが絡むテストケース（家族構成など）にも対応できる。Clerkの「Testing Tokens」（`@clerk/testing`）はブラウザ経由の実サインインフローでボット検知を回避する仕組みであり、`app.request()`で直接ハンドラを叩くこの層には不要。
