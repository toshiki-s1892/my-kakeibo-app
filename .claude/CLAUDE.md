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
@docs/tasks/cross-cutting/setup.md
@docs/tasks/features/profile-setup.md

## 作業ルール

- 実装方法を提示する前に、まずアーキテクチャレベルの代替案を検討し全体像を提示すること。仕様書に実装方法が記載されていても、より適切な実装場所・方法がないか先に検討する
- エラーハンドリング・認証・ログなど横断的関心事（cross-cutting concerns）を実装するときは、既存の他のエラー処理と統合できないか必ず全体像を確認してから提案すること
- ユーザーが代替案を質問してきた場合は、即座に否定せず、全体アーキテクチャへの影響を調査してから回答すること
- DB アクセスは UI コンポーネントやレイアウトに直接書かず、`server/lib/` にヘルパー関数として切り出すこと（Next.js 公式が推奨する DAL パターン）
- ライブラリ・フレームワークの使い方や構成を提示する際は、必ず公式ドキュメントを確認してから回答すること
- 非推奨 API や破壊的変更がある可能性があるため、バージョンも考慮すること
- ユーザーが自分で実装したいため、明示的に依頼されない限りファイルの変更・作成を行わないこと。問題の指摘や説明にとどめること
- 会話の中でドキュメント（docs/ および本ファイル CLAUDE.md）の更新が必要と判断した場合は、その旨を一言伝えるにとどめること。実際の更新はユーザーが `/update-docs` を呼び出したタイミングで行う。`/update-docs` はCLAUDE.md自体（作業ルール・スタイルガイド等）の更新も対象に含む
- ドキュメントは1ファイルが冗長になる場合、ディレクトリ分割・ファイル分割して可読性を維持すること

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

## テスト・コンポーネントカタログ ルール

- コンポーネントテストは導入しない（[architecture/decisions/testing-strategy.md](../docs/architecture/decisions/testing-strategy.md)参照）。コンポーネントの見た目確認はコンポーネントカタログページ（開発時のみアクセス可能）で行う
- フォームコンポーネントはロジックと表示を分離し、propsベースの表示専用コンポーネントとして実装すること
  - Route コンポーネント（`*Route.tsx`）: フックを呼び出しpropsを渡す
  - Form コンポーネント（`*Form.tsx`）: props を受け取るだけの表示専用
- `features/` 配下の `types/` ディレクトリは複数ファイルから参照される型のみ置くこと。単一コンポーネントのprops型はそのファイルに同居させること
- API ミューテーションは `mutate` + コールバック方式（`onSuccess`/`onError`）で統一すること
  - orval 生成 hooks は HTTP エラーでも throw しないため `mutateAsync` + `try/catch` は機能しない
