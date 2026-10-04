# Node.js runtimeへの移行（edgeの廃止）

方針の詳細は [stack.mdの実行環境](../../architecture/decisions/stack.md#実行環境-vercel-nodejs-runtime2026-09-19決定) を参照。

## バックエンド

- [x] 1. `apps/web/app/api/[...route]/route.ts`の`export const runtime = 'edge'`を削除する
- [ ] 2. Vercelダッシュボード（Settings → Functions）で現在の関数リージョンを確認する。新規プロジェクトの既定は`iad1`（米国東海岸）のため、DBの所在地の近く（東京は`hnd1`。Hobbyは単一リージョンのみ）に設定する。`vercel.json`は現状なし
- [ ] 3. TursoのDBの所在地をTursoのダッシュボードで確認する（リポジトリのドキュメントには記載がない。2の設定の根拠になる）
- [ ] 4. Vercelダッシュボードで、Fluid computeが有効か、実際に使われるNode.jsバージョンが`engines.node`（`>=24`）と一致するかを確認する。一致が確認できたら[api-conventions.mdの`Map.groupBy`禁止ルール](../../architecture/decisions/api-conventions.md#honoルートの実装方針)を見直す
- [ ] 5. Previewデプロイで次を確認する
  - ビルドが通る（`@libsql/client`のNode.js版がネイティブ部品`libsql`に依存するため）
  - 認証つきの`GET /api/categories`が成功する（Clerk認証とDB読み込み）
  - 書き込み系（`PUT /api/categories/:id/pin`）が成功する
  - デプロイ概要に表示される関数リージョンが意図どおり
  - 応答時間が移行前と大きく変わらない（Previewではバイトコードキャッシュが効かないため、速度は参考値）
  - ロガーの`info`のログ（`console.info`）が、Vercelのログ画面でinfoとして表示される（公式の対応表に`console.info`の明記がないため。`stdout`に出るのでinfoの見込み。表示されなければ`console.log`に切り替える。[security.md](../../architecture/decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）
  - `warn`のログ（`console.warn`）が、Vercelの「Error」の絞り込みに出る（公式の表では通常の関数で`console.warn`はerror）。4xxの完了ログでErrorの絞り込みがノイズだらけになる場合は、`logger.ts`の`output`の対応表で`warn`の出力先を調整する（JSONの`level`は変えない）
  - 4xxのリクエストが、Vercelによって自動でWarningとマークされ、5xxはErrorとマークされる（公式ドキュメントの記述どおりか）
- [ ] 6. 本番反映後に応答時間を確認する

## フロントエンド

- [ ] 1. （フロントエンド実装なし）

## クリーンアップ

- [ ] 1. （未定）
