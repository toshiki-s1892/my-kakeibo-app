# 開発フロー（Lefthook・CI・PRレビュー）

全体フロー図（どのチェックがどの段階で実行されるか）はルートの [README.md](../../../README.md#開発フロー) を参照。本ファイルは分担の理由・意思決定の記録を扱う。

**Lefthook（ローカル・pre-commit）:**

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      run: bun run lint
    format:
      run: bunx prettier --write {staged_files}
      glob: '*.{ts,tsx,md}'
      stage_fixed: true
    type-check:
      run: bun run check-types
    test:
      run: bunx vitest related --run {staged_files}
      root: 'apps/web/'
      glob: '*.{ts,tsx}'
```

`format`は全ファイル対象の`bun run format`ではなく、**ステージ済みファイルのみ**を`--write`で整形し、`stage_fixed: true`で整形結果を自動で`git add`する（Lefthook公式の[stage_fixed](https://lefthook.dev/configuration/stage_fixed/)）。これにより「コミットには未整形のコードが入り、整形差分がワーキングツリーに残る」問題を防ぐ。

**Vitestは「関連テストのみ」pre-commitで実行する（2026-07-10改訂）:** 当初は「テストが増えるとコミット待ち時間が伸びる」ためpre-commitに含めない方針だったが、[`vitest related`](https://vitest.dev/guide/cli.html)（ステージ済みファイルを静的importで参照しているテストだけを実行する公式コマンド）を使えば実行対象が絞られ待ち時間の懸念が小さいため、早期検知として導入した。全テストの実行は従来どおりCIのみ。

- `related`のテスト選択は静的import解析ベースのため、実行時に初めて繋がる依存（MSWモックと実APIの食い違い・マイグレーションSQL等）は検知できない。このすり抜けはCIの全テスト実行で捕まえる
- `root: "apps/web/"`により`apps/web`配下のステージ済みファイルだけが対象。将来`packages/common`にテストを追加したら同様のコマンドをもう1つ追加する

**CI（GitHub Actions、PR作成・更新時）:**

- lint・型チェック・Vitest単体テスト・build を実行する
- Playwright E2Eは実行時間が長いため、CIへの組み込みは別途検討する

**役割分担:**

| 層                                   | 実行場所       | 強制力                              | 役割                           |
| ------------------------------------ | -------------- | ----------------------------------- | ------------------------------ |
| Lefthook                             | ローカル       | 弱い（`--no-verify`でスキップ可能） | コミット前の早期フィードバック |
| CI                                   | GitHub Actions | 強い（Branch Protectionで必須化）   | マージ前の機械的な品質ゲート   |
| コードレビュー（claude-code-action） | GitHub Actions | レビューコメントのみ                | 設計・可読性などの質的チェック |

Lefthookは「ベストエフォートな早期検知」、CIは「すり抜けを防ぐ強制ゲート」という役割分担のため、Lefthookを導入してもCIのチェックは省略しない。

**PR自動コードレビュー: claude-code-action**

- Anthropic公式の `claude-code-action`（GitHub Action）を導入し、PR作成・更新のたびに自動でレビューコメントを実行する
- 認証は `CLAUDE_CODE_OAUTH_TOKEN`（`claude setup-token` で発行）を使用し、Claude Pro/Maxサブスクリプションの利用枠を消費する方式とする（`ANTHROPIC_API_KEY` による従量課金は使わない）
- レビューはこのリポジトリの `CLAUDE.md` を基準に行われる

**懸念点:** OAuthトークン方式はインタラクティブなClaude Code利用と同じ利用枠を共有するため、PRレビューが頻発すると通常作業に使える枠が圧迫される可能性がある。レビュー頻度が増えてきた場合はAPIキー方式（従量課金・枠分離）への切り替えを検討する。
