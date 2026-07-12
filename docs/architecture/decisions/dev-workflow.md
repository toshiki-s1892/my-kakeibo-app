# 開発フロー（Lefthook・CI・PRレビュー）

全体フロー図（どのチェックがどの段階で実行されるか）はルートの [README.md](../../../README.md#開発フロー) を参照。本ファイルは分担の理由・意思決定の記録を扱う。

**pre-commitは「ステージ済みファイルのみの軽量チェック」、全体品質はCIで担保する（2026-07-12改訂）:**

当初pre-commitではlint・型チェックをリポジトリ全体に実行していたが、無関係な既存ファイルの問題で部分コミットがブロックされる問題が起きたため、「pre-commit = 自分が触ったファイルだけの高速チェック」「CI = リポジトリ全体の強制ゲート」に役割を再分担した。

- `lint`: 全体実行（`bun run lint`）から**ステージ済みファイルのみ**（`bunx eslint {staged_files}`）に変更。ESLint v9のflat configは実行ディレクトリ基準で`eslint.config.js`を探すため、`root: 'apps/web/'`の指定が必須（ルートにはconfigが無い）。lintを持つパッケージが増えたら`root`を変えたコマンドを追加する
- `type-check`: **pre-commitから削除**。tscは部分チェックが原理的に不可能なため（型はファイルをまたいで伝播するので、ステージ済みファイルだけ検査しても呼び出し側の壊れを見逃す。また`tsc <file>`はtsconfig.jsonを無視する仕様）。型の担保はCIの全体チェックに一本化する

**Lefthook（ローカル・pre-commit）:**

```yaml
pre-commit:
  parallel: true
  commands:
    lint-web:
      run: bunx eslint --max-warnings 0 {staged_files}
      root: 'apps/web/'
      glob: '*.{ts,tsx}'
    format:
      run: bunx prettier --write {staged_files}
      glob: '*.{ts,tsx,md}'
      stage_fixed: true
    test-web:
      run: bunx vitest related --run {staged_files}
      root: 'apps/web/'
      glob: '*.{ts,tsx}'
    test-common:
      run: bunx vitest related --run {staged_files}
      root: 'packages/common/'
      glob: '*.{ts,tsx}'
```

`format`は全ファイル対象の`bun run format`ではなく、**ステージ済みファイルのみ**を`--write`で整形し、`stage_fixed: true`で整形結果を自動で`git add`する（Lefthook公式の[stage_fixed](https://lefthook.dev/configuration/stage_fixed/)）。これにより「コミットには未整形のコードが入り、整形差分がワーキングツリーに残る」問題を防ぐ。

**Vitestは「関連テストのみ」pre-commitで実行する（2026-07-10改訂）:** 当初は「テストが増えるとコミット待ち時間が伸びる」ためpre-commitに含めない方針だったが、[`vitest related`](https://vitest.dev/guide/cli.html)（ステージ済みファイルを静的importで参照しているテストだけを実行する公式コマンド）を使えば実行対象が絞られ待ち時間の懸念が小さいため、早期検知として導入した。全テストの実行は従来どおりCIのみ。

- `related`のテスト選択は静的import解析ベースのため、実行時に初めて繋がる依存（MSWモックと実APIの食い違い・マイグレーションSQL等）は検知できない。このすり抜けはCIの全テスト実行で捕まえる
- lefthookの`root`は「コマンドの実行ディレクトリ変更」「`{staged_files}`をそのディレクトリ配下に絞り相対パス化」「対象ファイルが無ければコマンド自体をスキップ」の3つを兼ねる（[Lefthook公式](https://lefthook.dev/configuration/root/)）。`vitest related`は実行ディレクトリのvitest.config.tsしか見ないため、configを持つパッケージごとにコマンドを分ける（`test-web`・`test-common`）

**CI（GitHub Actions `.github/workflows/ci.yml`、main/developへのpush・PR時）:**

`playwright.yml`を`ci.yml`にリネームし、単一ワークフロー「CI」として構成（2026-07-12導入）。

- 実行順は「**速くて壊れやすいものから先に**」: lint → 型チェック → Vitest単体テスト（→ E2E）。ステップが失敗するとそこで止まるため、フィードバックまでの待ち時間が最小になる
- buildは現状未組み込み（導入時にこのファイルとREADMEのフロー図を更新する）
- **`paths-ignore`でドキュメントのみの変更をスキップする（2026-07-12導入）**: `docs/**`・`.claude/**`・`**.md`の変更**だけ**で構成されるpush/PRではCIを起動しない。CIは毎回まっさらなマシンでcheckout + `bun install`（1〜2分）から始まるため、コードに影響しない変更で起動しても時間とActions無料枠の無駄になる。コードとdocsを両方含む変更では通常どおり実行される
- **Playwright E2Eのステップは一時的にコメントアウト中**。再有効化の条件:
  1. `apps/web/e2e/` に最初のテスト（onboarding.spec.ts）を作成する（現状0件のため、有効化すると「No tests found」でCIが落ちる）
  2. GitHub リポジトリのSecretsにClerkのキー類（ローカルの`.env.local`相当）を登録し、E2Eステップに`env:`で渡す
  3. `playwright.config.ts`の`webServer.port`をdevサーバーの実ポート3001に揃える（`baseURL`は修正済み。portの不一致があると60秒タイムアウトで失敗する）

**ブランチ運用（2026-07-12決定）:**

git-flowの簡略版を採用する。`production`等のリリース専用ブランチは追加しない（mainがその役割を兼ねる。別ブランチが必要になるのは複数環境デプロイやホットフィックスの分離運用が発生した場合で、現状の規模では不要）。

- `main` — リリース（本番）。直接pushは不可（Rulesetで保護）。リリース時に`develop → main`のPRを出す
- `develop` — 日常の開発統合先。GitHubのデフォルトブランチに設定（PR作成時のマージ先が自動でdevelopになり、誤ってmainへ直マージする事故を防ぐ）
- `feature/*` — 機能単位の作業ブランチ。developへPRを出す
- `/update-docs`によるドキュメント更新は**そのとき作業中のブランチ**にコミットする（mainへ直接入れない）。docsはそれを生んだ作業と同じPRで流すことで、コードとdocsのマージタイミングのズレを防ぐ。作業と無関係なdocs修正が単発で必要な場合のみ`docs/*`ブランチを切る

**PR作成のスキル化（2026-07-12導入）:**

PR本文の品質・形式のばらつきを防ぐため `.github/PULL_REQUEST_TEMPLATE.md`（概要・変更内容・確認方法・関連）を導入し、push〜PR作成の定型作業を `.claude/skills/create-pr`（`/create-pr`）に集約した。手順の詳細はルート [README.md](../../../README.md#pr-作成) を参照。

- マージ先はブランチ運用ルールから自動判定する（`feature/*`・`docs/*` → `develop`、`develop` → `main` のリリースPR。`main` 上では中断）
- 全自動にはせず、**タイトル・本文はユーザー承認を得てからPRを作成する**方式とした。PRはレビュー・リリースノートの入力になる外部向け成果物であり、生成内容の誤りを後から直すより作成前に確認するほうがコストが低いため
- docsのみのPRが `main` に向かうと `paths-ignore` により必須ステータスチェックが満たされずマージ不能になる（上記Rulesetの項参照）。このケースはスキル側で警告し、管理者バイパスで対応する

**mainのRuleset（Branch Protection）設定（2026-07-12導入）:**

| 設定                                  | 値                                                 |
| ------------------------------------- | -------------------------------------------------- |
| 対象                                  | `main`（名前指定。デフォルトブランチ指定にしない） |
| Require a pull request before merging | 有効（承認数0。個人開発のため）                    |
| Require status checks to pass         | 有効（`test`ジョブ。up to date要求も有効）         |
| Block force pushes                    | 有効                                               |
| バイパスリスト                        | Repository admin                                   |

**バイパスリストにRepository adminを入れる理由:** CIの`paths-ignore`と必須ステータスチェックは干渉する。docsのみのPRをmainに出すとCIが起動せず、必須チェックが「Expected（報告待ち）」のまま満たされずマージ不能になる（GitHubはスキップを成功と解釈しない）。公式に案内される回避策「同名ジョブの常時成功ダミーワークフロー」は、コードとdocsを両方含むPRで本物とダミーの両方が起動して結果が曖昧になる既知の欠点がある（[GitHub Community #44490](https://github.com/orgs/community/discussions/44490)・[Pantsbuildの解説](https://www.pantsbuild.org/blog/2022/10/10/skipping-github-actions-jobs-without-breaking-branch-protection)）。運用上docsのみのPRがmainに向かうのはレアケース（リリースPRはコードを含む）のため、ダミーワークフローは導入せず、詰まった場合は管理者バイパスでマージする方針とした。なおRulesetsは旧Branch Protectionと異なり**管理者も例外なくブロックするのがデフォルト**のため、バイパスリストへの明示的な追加が必要。チーム開発に移行して管理者バイパス頼みが不適切になったら、その時点でダミーワークフロー方式を再検討する。

**役割分担:**

| 層                                   | 実行場所       | 強制力                              | 役割                           |
| ------------------------------------ | -------------- | ----------------------------------- | ------------------------------ |
| Lefthook                             | ローカル       | 弱い（`--no-verify`でスキップ可能） | コミット前の早期フィードバック |
| CI                                   | GitHub Actions | 強い（Branch Protectionで必須化）   | マージ前の機械的な品質ゲート   |
| コードレビュー（claude-code-action） | GitHub Actions | レビューコメントのみ                | 設計・可読性などの質的チェック |

Lefthookは「ベストエフォートな早期検知」、CIは「すり抜けを防ぐ強制ゲート」という役割分担のため、Lefthookを導入してもCIのチェックは省略しない。

**PR自動コードレビュー: claude-code-action（2026-07-12導入完了）**

- Anthropic公式の `claude-code-action@v1` を `.github/workflows/claude-review.yml` で導入した。**レビュー観点・重要度ラベル・出力形式はワークフローファイル内のプロンプトが正**であり、ここには重複記載しない（変更もワークフローファイル側で行う）
- 認証は `CLAUDE_CODE_OAUTH_TOKEN`（`claude setup-token` で発行しリポジトリSecretsに登録済み）を使用し、Claude Proサブスクリプションの利用枠を消費する方式とする（`ANTHROPIC_API_KEY` による従量課金は使わない。なおWeb記事で「1レビュー$15〜25」と言われるのはTeam/Enterprise向けマネージド版Code Reviewの話で、本構成とは課金構造が別物）
- リポジトリの `.claude/CLAUDE.md`（とそこからimportされるdocs/）がレビュー時にも読み込まれるため、プロジェクト規約が自動的にレビュー基準になる

**実行回数の制御（2026-07-12決定）:** 利用枠がインタラクティブなClaude Code作業と共有のため、レビューは「**PR作成時（`opened`）に1回 + PRに `/re-review` とコメントしたときのみ再実行**」に制御する。`synchronize` トリガーは採用しない（修正pushのたびにフルレビューが走り枠を消費するため。修正はまとめてpushする運用とも整合）。設計上の根拠:

- GitHub Actions の Re-run は**元のコミットを再実行する**仕様のため、修正push後の再レビュー手段にならない（古いコミットを見てしまう）。コメントトリガーなら実行時に `gh pr diff` で最新差分を見る
- `issue_comment` トリガーは**デフォルトブランチ上のワークフローファイルを参照する**ため、`/re-review` が有効になるのはワークフローがdevelopにマージされた後（ワークフロー追加PR自体では `opened` の初回レビューのみ動く）
- `issue_comment` 時はデフォルトブランチがcheckoutされるため、ワークフロー内で `gh pr checkout` によりPRブランチへ切り替えている
- `/re-review` を含まない通常コメントでもワークフローは起動するが、ジョブ冒頭の `if` で即スキップされActions実行時間は消費しない

**懸念点:** OAuthトークン方式はインタラクティブなClaude Code利用と同じ利用枠を共有するため、PRレビューが頻発すると通常作業に使える枠が圧迫される可能性がある。実行回数の制御（上記）はこの緩和策。それでも枠の圧迫が問題になった場合はAPIキー方式（従量課金・枠分離）への切り替えを検討する。
