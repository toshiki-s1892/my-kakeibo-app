# 開発ツール導入（Lefthook・CI・PR自動レビュー）

方針の詳細は [dev-workflow.md](../../architecture/decisions/dev-workflow.md) を参照。

## 1. Lefthook

- [x] 1. `lefthook` を devDependencies に追加
- [x] 2. `lefthook.yml` を作成（pre-commit: lint・format・型チェック）
- [x] 3. `bun install` 時に `lefthook install` が自動実行されるよう設定

## 2. CI（GitHub Actions）

- [ ] 1. `.github/workflows/ci.yml` を作成
- [ ] 2. PR作成・更新時に lint・型チェック・Vitest単体テスト・build を実行
- [ ] 3. GitHubのBranch Protectionで上記ジョブを必須ステータスチェックに設定
- [ ] 4. ルート `README.md` の開発フロー図（仮で作成済み）をCIの実態に合わせて更新

## 3. claude-code-action（PR自動コードレビュー）

- [ ] 1. ローカルで `claude setup-token` を実行し、OAuthトークンを発行
- [ ] 2. リポジトリのSecretsに `CLAUDE_CODE_OAUTH_TOKEN` を設定
- [ ] 3. `/install-github-app` でGitHub App連携をセットアップ、または `.github/workflows/claude.yml` を作成
- [ ] 4. PRを作成して自動レビューが動作することを確認
- [ ] 5. ルート `README.md` の開発フロー図（仮で作成済み）を自動レビューの実態に合わせて更新
