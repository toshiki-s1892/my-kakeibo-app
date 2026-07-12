# 実装タスク

## 進め方のルール

- タスク管理にGitHub Issuesは使わず、このディレクトリ（docs/tasks/）を正とする（2026-07-12決定。理由: CLAUDE.md経由で毎セッションClaudeの文脈に自動で入る・仕様検討の作業場を兼ねる・コードと同じPRで進捗更新が流れる。PRとの自動リンクやカンバンが欲しくなったら「着手時にIssueを1枚切ってPRにリンクする」ハイブリッドを再検討する）
- 実装順序や設計の決定はClaudeと相談して決める
- 決定した順序・内容は各ファイルに随時更新する
- 他のスレッドに移行する際はこのディレクトリを参照して文脈を引き継ぐ
- 仕様検討中にDBスキーマ変更（カラム追加など）が必要と判明した場合は、その場で該当機能の `docs/tasks/features/{feature名}.md` に追記する（ファイルが無ければ作成する）。会話の中だけに残すと実装時に忘れるため
- 同時に [docs/architecture/schema.dbml](../architecture/schema.dbml) も更新する（実装前の確定仕様も反映してよい）。タスクファイルは「これから実装すること」、`schema.dbml`は「確定したスキーマの全体像」という役割分担

## 画面別タスク（[features/](./features/)）

| 画面             | ファイル                                                          | 状態   |
| ---------------- | ----------------------------------------------------------------- | ------ |
| プロフィール設定 | [profile-setup.md](./features/profile-setup.md)                   | 進行中 |
| ダッシュボード   | [dashboard.md](./features/dashboard.md)                           | 未着手 |
| カテゴリ管理     | [categories.md](./features/categories.md)                         | 未着手 |
| 家族構成管理     | [family-members.md](./features/family-members.md)                 | 未着手 |
| 取引記録         | 未作成                                                            | 未着手 |
| 定期取引         | [recurring-transactions.md](./features/recurring-transactions.md) | 未着手 |
| AI機能           | [ai.md](./features/ai.md)                                         | 未着手 |
| ヘルプ           | [help.md](./features/help.md)                                     | 未着手 |

## 横断タスク（[cross-cutting/](./cross-cutting/)）

| 内容                                                     | ファイル                                               | 状態   |
| -------------------------------------------------------- | ------------------------------------------------------ | ------ |
| テストツール導入（Vitest/Playwright）                    | [testing-setup.md](./cross-cutting/testing-setup.md)   | 未着手 |
| 開発ツール導入（Lefthook/CI/PR自動レビュー）             | [dev-tooling.md](./cross-cutting/dev-tooling.md)       | 未着手 |
| ID設計のUUID化（全テーブル）                             | [uuid-migration.md](./cross-cutting/uuid-migration.md) | 未着手 |
| `(app)`レイアウト（ヘッダー・下部タブバー・取引追加FAB） | [app-layout.md](./cross-cutting/app-layout.md)         | 未着手 |
| `(auth)`レイアウト（ホームへ戻るリンク）                 | [auth-layout.md](./cross-cutting/auth-layout.md)       | 未着手 |

## 技術的な実装規約

API・サーバー実装の規約は[architecture/decisions/api-conventions.md](../architecture/decisions/api-conventions.md)、フロントエンド実装の規約は[architecture/decisions/frontend-conventions.md](../architecture/decisions/frontend-conventions.md)を参照（API認証・DBクライアント分離・スキーマimport・テーブル命名・orval運用方針など）。
