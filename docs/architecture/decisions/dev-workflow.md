# 開発フロー（Lefthook・CI・PRレビュー）

**Lefthook（ローカル・pre-commit）:**

```yaml
pre-commit:
  commands:
    lint:
      run: bun run lint
    format:
      run: bun run format
    type-check:
      run: bun run check-types
    test:
      run: bun run test # Vitest単体テストのみ。Playwrightは重いため対象外
```

**CI（GitHub Actions、PR作成・更新時）:**
- lint・型チェック・Vitest単体テスト・build を実行する
- Playwright E2Eは実行時間が長いため、CIへの組み込みは別途検討する

**役割分担:**

| 層 | 実行場所 | 強制力 | 役割 |
|---|---|---|---|
| Lefthook | ローカル | 弱い（`--no-verify`でスキップ可能） | コミット前の早期フィードバック |
| CI | GitHub Actions | 強い（Branch Protectionで必須化） | マージ前の機械的な品質ゲート |
| コードレビュー（claude-code-action） | GitHub Actions | レビューコメントのみ | 設計・可読性などの質的チェック |

Lefthookは「ベストエフォートな早期検知」、CIは「すり抜けを防ぐ強制ゲート」という役割分担のため、Lefthookを導入してもCIのチェックは省略しない。

**PR自動コードレビュー: claude-code-action**

- Anthropic公式の `claude-code-action`（GitHub Action）を導入し、PR作成・更新のたびに自動でレビューコメントを実行する
- 認証は `CLAUDE_CODE_OAUTH_TOKEN`（`claude setup-token` で発行）を使用し、Claude Pro/Maxサブスクリプションの利用枠を消費する方式とする（`ANTHROPIC_API_KEY` による従量課金は使わない）
- レビューはこのリポジトリの `CLAUDE.md` を基準に行われる

**懸念点:** OAuthトークン方式はインタラクティブなClaude Code利用と同じ利用枠を共有するため、PRレビューが頻発すると通常作業に使える枠が圧迫される可能性がある。レビュー頻度が増えてきた場合はAPIキー方式（従量課金・枠分離）への切り替えを検討する。
