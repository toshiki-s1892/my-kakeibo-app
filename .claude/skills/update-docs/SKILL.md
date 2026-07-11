---
name: update-docs
description: 会話で確定した仕様・設計・技術的意思決定をdocs/およびCLAUDE.mdに反映する。
---

会話の中で確定した仕様・設計・技術的意思決定を `docs/`・ルート `README.md`・`.claude/CLAUDE.md` に反映する。

## 手順

1. **変更対象の特定**
   - 会話を振り返り、確定した仕様・設計・技術的意思決定を洗い出す
   - 影響するファイルを特定する（[対象ドキュメント](#対象ドキュメント)参照。`docs/README.md`の「更新先の対応表」も参考にする）
   - Claude自身の作業ルール・権限（ファイル変更の可否等）が変わった場合は `.claude/CLAUDE.md` も対象に含める

2. **更新内容の提示**
   - 対象ファイルと更新内容を箇条書きで提示する
   - 新規ファイルが必要な場合はそのパスと内容も提示する
   - ユーザーの承認を得てから実行する

3. **実行**
   - 承認を得たら更新を実行する
   - 1ファイルが冗長になる場合はディレクトリ分割・ファイル分割して可読性を維持する（例: `docs/architecture/decisions/`のようにテーマ別ファイルに分ける）
   - 既存の記述と矛盾する箇所があれば上書き・削除する
   - 複数ファイルに同じ内容を重複して書かない。詳細は1箇所に書き、他はそこへのリンクで参照する

## 対象ドキュメント

| ファイル                                                    | 記載内容                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ルート `README.md`                                          | 人間向けの入口情報（セットアップ手順・コマンド一覧・開発フロー図・技術スタック・ドキュメント一覧）。変更が生じたら適宜追記・更新する        |
| `docs/README.md`                                            | ディレクトリマップ・更新先の対応表                                                                                                          |
| `docs/specs/product.md`                                     | プロダクト全体の要件                                                                                                                        |
| `docs/specs/overview.md`                                    | 画面一覧・API概要・コード値・バリデーション規則                                                                                             |
| `docs/specs/features/*.md`                                  | 機能ごとの詳細仕様                                                                                                                          |
| `docs/architecture/overview.md`                             | システム構成・ディレクトリ構成・画面レイアウトの決定                                                                                        |
| `docs/architecture/decisions/*.md`                          | 技術的意思決定・実装規約（テーマ別: stack/api-conventions/frontend-conventions/security/testing-strategy/dev-workflow/design-docs-tooling） |
| `docs/architecture/database.md`・`schema.dbml`              | DBスキーマ                                                                                                                                  |
| `docs/design/`                                              | 画面モックアップ・画面設計書                                                                                                                |
| `docs/tasks/features/*.md`・`docs/tasks/cross-cutting/*.md` | 実装タスクの進捗                                                                                                                            |
| `.claude/CLAUDE.md`                                         | Claudeの作業ルール・スタイルガイド・importする`docs/`ファイル一覧                                                                           |
