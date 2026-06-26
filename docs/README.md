# ドキュメント全体マップ

`docs/`配下は目的別に4つのディレクトリで構成する。「何を知りたいか」「何を更新すべきか」に応じて以下を参照する。

| ディレクトリ | 内容 | こんな時に見る |
|---|---|---|
| [specs/](./specs/) | プロダクト要件・画面一覧・API概要・コード値定義・機能ごとの詳細仕様（バリデーション・業務フロー・権限） | 「この機能は何をすべきか」を知りたい・確認したい時 |
| [architecture/](./architecture/) | 技術選定理由（[decisions/](./architecture/decisions/)）・システム構成・実装規約・DB設計・画面遷移図 | 「なぜこの技術・設計を選んだか」「どう実装すべきか」を知りたい時 |
| [design/](./design/) | Stitchで作成した画面モックアップと画面設計書（採番済みスクリーンショット・パーツ一覧） | 「画面の見た目・配色・パーツ構成」を確認したい時 |
| [tasks/](./tasks/) | 実装タスクの進捗管理（機能別・横断） | 「次に何を実装すべきか」を知りたい時 |

## 更新先の対応表

会話の中で何かが確定したとき、以下を参考にどのファイルを更新するか判断する（実際の更新は`/update-docs`実行時に行う。[CLAUDE.mdの作業ルール](../.claude/CLAUDE.md)参照）。

| 確定した内容 | 更新先 |
|---|---|
| プロダクト全体の方向性・要件 | [specs/product.md](./specs/product.md) |
| 画面一覧・API概要・コード値・バリデーション規則 | [specs/overview.md](./specs/overview.md) |
| 機能固有の仕様（業務フロー・権限・バリデーション） | [specs/features/{feature}.md](./specs/features/) |
| 技術スタックの選定理由 | [architecture/decisions/stack.md](./architecture/decisions/stack.md) |
| API・サーバー実装の規約 | [architecture/decisions/api-conventions.md](./architecture/decisions/api-conventions.md) |
| フロントエンド実装の規約 | [architecture/decisions/frontend-conventions.md](./architecture/decisions/frontend-conventions.md) |
| セキュリティ・テスト・開発フローの方針 | [architecture/decisions/](./architecture/decisions/)配下の該当ファイル |
| システム構成図・ディレクトリ構成・画面レイアウト | [architecture/overview.md](./architecture/overview.md) |
| DBスキーマ | [architecture/database.md](./architecture/database.md)・[architecture/schema.dbml](./architecture/schema.dbml) |
| 画面の見た目・モックアップ | [design/](./design/)（新規作成・更新の手順は[design/README.md](./design/README.md)参照） |
| 実装タスクの追加・進捗 | [tasks/features/](./tasks/features/)または[tasks/cross-cutting/](./tasks/cross-cutting/) |
| Claude自身の作業ルール・権限 | `.claude/CLAUDE.md`（`/update-docs`の更新対象に含む） |
