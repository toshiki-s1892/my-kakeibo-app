@docs/README.md
@docs/specs/product.md
@docs/specs/overview.md
@docs/specs/features/profile-setup.md
@docs/architecture/overview.md
@docs/architecture/decisions/stack.md
@docs/architecture/decisions/api-conventions.md
@docs/architecture/decisions/frontend-conventions.md
@docs/architecture/decisions/security.md
@docs/architecture/decisions/testing-strategy.md
@docs/architecture/decisions/dev-workflow.md
@docs/architecture/decisions/design-docs-tooling.md
@docs/architecture/database.md
@docs/tasks/README.md
@docs/tasks/cross-cutting/testing-setup.md
@docs/tasks/features/profile-setup.md

## import の運用ルール

- 上記の `@docs/` import のうち、`specs/features/` と `tasks/` 配下は**進行中の機能・タスクのファイルのみ**を import する（全機能を import するとコンテキストを圧迫するため）
- 機能・タスクが完了したら import から外し、次に着手する機能のファイルに差し替える（ファイル自体は docs/ に残す）。この差し替えは `/update-docs` の対象に含む

## 作業ルール

- 実装方法を提示する前に、まずアーキテクチャレベルの代替案を検討し全体像を提示すること。仕様書に実装方法が記載されていても、より適切な実装場所・方法がないか先に検討する
- エラーハンドリング・認証・ログなど横断的関心事（cross-cutting concerns）を実装するときは、既存の他のエラー処理と統合できないか必ず全体像を確認してから提案すること
- ユーザーが代替案を質問してきた場合は、即座に否定せず、全体アーキテクチャへの影響を調査してから回答すること
- DB アクセスは UI コンポーネントやレイアウトに直接書かず、`server/lib/` にヘルパー関数として切り出すこと（Next.js 公式が推奨する DAL パターン）
- DB スキーマの適用は `drizzle-kit migrate` を使うこと（`db:push` は適用履歴を記録せず、結合テストが再生するマイグレーションファイルと実DBの整合を保証できないため使わない。[stack.md](../docs/architecture/decisions/stack.md#マイグレーション運用drizzle-kit-generate--migrate2026-07-20にpush運用から変更)参照）
- 外部サービス（Gemini 等）の新規接続は `server/lib/` に薄いアダプタを1箇所だけ作り、テストはそのモジュール境界を `vi.mock` で差し替えること。依存ごとに新しい差し替え機構を発明しない（[testing-strategy.md](../docs/architecture/decisions/testing-strategy.md#外部依存の差し替え方針2026-07-20決定)参照）
- ライブラリ・フレームワークの使い方や構成を提示する際は、必ず公式ドキュメントを確認してから回答すること
- 非推奨 API や破壊的変更がある可能性があるため、バージョンも考慮すること
- ユーザーが自分で実装したいため、明示的に依頼されない限りファイルの変更・作成を行わないこと。問題の指摘や説明にとどめること
- 会話の中でドキュメント（docs/ および本ファイル CLAUDE.md）の更新が必要と判断した場合は、その旨を一言伝えるにとどめること。実際の更新はユーザーが `/update-docs` を呼び出したタイミングで行う。`/update-docs` はCLAUDE.md自体（作業ルール・スタイルガイド等）の更新も対象に含む
- ドキュメントは1ファイルが冗長になる場合、ディレクトリ分割・ファイル分割して可読性を維持すること
- 人間向けの入口情報（セットアップ手順・コマンド一覧・開発フロー図などのWhat）はルート `README.md` に置き、意思決定の理由・背景（Why）は `docs/architecture/decisions/` に置くこと。同じ図・内容を両方に重複して書かず、一方からもう一方へリンクで参照する
- モデル専用ファイル（`.claude/skills/`・`.claude/agents/`・CIのレビュープロンプト等）は**英語で記述**すること（トークン効率のため）。ただし成果物（レビューコメント・PR本文・調査レポート・Notionメモ等）は**日本語で出力**するよう各ファイルに明記する。人間向けの役割一覧はルート `README.md` の「Claude Code スキル・エージェント一覧」で管理する
- ルート `README.md` も `/update-docs` の更新対象に含めること。セットアップ手順・コマンド・技術スタック・開発フロー・ドキュメント一覧に変更があったら適宜追記・更新する
- `/update-docs` によるドキュメント更新は**そのとき作業中のブランチ**にコミットする（mainへ直接入れない）。画面と無関係なdocs更新が feature ブランチに混ざるのは許容する（その決定を生んだ作業と同じPRで流す方針。[dev-workflow.md](../docs/architecture/decisions/dev-workflow.md)参照）
- `settings.json` の許可リスト（`permissions.allow`）に任意コード実行と等価のワイルドカード（`Bash(python3 -c *)`・`Bash(bash -c *)`・`Bash(npx *)` 等のインタプリタ・パッケージランナー）を追加しないこと。スクリプト実行を許可する場合は特定スクリプトパスに固定する

## shadcn/ui ルール

- shadcn/ui のスタイルは `new-york` を使用すること（`default` は deprecated）
- shadcn のドキュメントを参照する際は `/docs/components/` のパスを確認すること（`/docs/components/base/` は Base UI 用であり、このプロジェクトでは使用しない）
- コンポーネント追加・再生成は `bunx shadcn@latest add <component> --overwrite` で行うこと
- モーダル・通知系コンポーネントは用途で使い分けること
  - 削除等の確認（Yes/No判断が必要）: `AlertDialog`
  - フォーム入力（カテゴリ新規追加等）: `Dialog`
  - 処理結果の通知（保存・削除完了等、ユーザーの判断を待たない）: `Sonner`（トースト）

## フォーム実装ルール

- Radix UI の Select は `value` に `undefined` を渡すと非制御モードになるため、`field.value ?? ''` を使うこと
- Zod スキーマで Select フィールドは `z.enum([...])` に **string** 値を渡すこと（Radix UI は常に string を返す）
- DB 保存用の数値コード（`GENDER_CODE` 等）への変換は `onSubmit` 内で行うこと
- Zod のデフォルトエラーメッセージは日本語ロケールをグローバル設定済み（`lib/zod-locale.ts` を `app/providers.tsx`・`app/api/[...route]/route.ts` で副作用 import）。新しい入口を作る際は import を忘れないこと（詳細は [frontend-conventions.md](../docs/architecture/decisions/frontend-conventions.md#zodエラーメッセージの日本語化グローバルロケール設定) 参照）

## テスト・コンポーネントカタログ ルール

- コンポーネントテストは導入しない（[architecture/decisions/testing-strategy.md](../docs/architecture/decisions/testing-strategy.md)参照）。コンポーネントの見た目確認はコンポーネントカタログページ（開発時のみアクセス可能）で行う
- フォームコンポーネントはロジックと表示を分離し、propsベースの表示専用コンポーネントとして実装すること
  - Route コンポーネント（`*Route.tsx`）: フックを呼び出しpropsを渡す
  - Form コンポーネント（`*Form.tsx`）: props を受け取るだけの表示専用
- `features/` 配下の `types/` ディレクトリは複数ファイルから参照される型のみ置くこと。単一コンポーネントのprops型はそのファイルに同居させること
- API ミューテーションは `mutate` + コールバック方式（`onSuccess`/`onError`）で統一すること
  - orval 生成 hooks は HTTP エラーでも throw しないため `mutateAsync` + `try/catch` は機能しない
- テストの記述規約（詳細は [testing-strategy.md](../docs/architecture/decisions/testing-strategy.md) 参照）
  - `describe` はコードの識別子を英語のまま（`Tests` 接尾辞・ファイル全体を括る describe は不要）、テスト名は日本語で振る舞いを書くこと
  - hooks 層・server 層のテストは、外側 describe（フック名・ハンドラ名）の内側に `describe('正常系')`・`describe('異常系')` の分類ラベルを置くこと（ラベル専用。beforeEach・共有変数は置かない）。schema 層はフィールド単位 describe でラベル不使用（分岐を持つロジックの層はラベルあり、入力検証の列挙の層はラベルなし、という整理）
  - テスト名は検証している規則を書き、サンプル値を書かないこと（「500が返ると」ではなく「204・400以外のステータスが返ると」。ステータス専用分岐の 204・400 は名前に書いてよい）
  - テストヘルパーは Arrange（＋共通 Act）のみ抽出し、`expect` は各テストに残すこと。引数フラグで分岐するヘルパーは作らない（AHA 原則）
  - `it` ではなく `test` を使うこと。`describe`/`test`/`expect`/`vi` 等の vitest API は **globals: true 設定済みのため import 不要**（新規テストでは import を書かない。tsconfig への `vitest/globals` 追加もセットで必要）
  - モックの呼び出し履歴は `clearMocks: true`（apps/web の vitest.config.ts 設定済み）でテスト毎に自動クリアされる。ファイル個別の `vi.clearAllMocks()` は書かないこと
  - 文字列定数そのものはテストしないこと（change-detector test になるため。テスト対象はロジックを持つ関数のみ）
  - schema 層のテストはメッセージの選択まで検証すること（期待値は `requiredMessage` 等の定数・関数への**参照**。文言ハードコードは禁止。Zod デフォルト文言に任せた箇所は文言を検証しない）
  - フックの異常系は MSW の `server.use()` で上書きすること（パスは orval 生成ハンドラと同じ `*/api/...` 形式。`onError` 分岐は `HttpResponse.error()` でのみ到達可能）
  - テストの実行は `bun run test` を使うこと（`bun test` は Bun 内蔵ランナーが起動し vitest.config.ts を読まないため禁止）

## 技術ブログ自動記録（かけぼアプリ開発）

### blog-note-writer 自動呼び出しルール

以下のいずれかが発生したら、作業の区切りで `.claude/agents/blog-note-writer` を呼び出すこと（ユーザーへの確認は不要。自動で実行する）：

1. ライブラリ・APIの非自明な挙動を発見し、回避策を実装した
2. 複数の実装アプローチを比較してひとつに決定した（トレードオフが明確）
3. エラーメッセージから根本原因を追跡する過程があった（原因が一見分かりにくかった）
4. 他のプロジェクトでも使える再利用可能なパターンを実装した
5. AI・ツール連携（Notion MCP、orval、Gemini API、Claude Code hooks等）の実用的な実装をした

単純な実装作業（既知のCRUD、スタイル調整、ドキュメントの編集）では呼び出さない。
1セッションにつき最大2回まで。
呼び出す際に、解決過程で参照した公式ドキュメントや記事のURLがあれば文脈に含めること。
