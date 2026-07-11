# AI機能

仕様の詳細は [specs/features/ai.md](../../specs/features/ai.md) を参照。

## バックエンド

- [ ] 1. `packages/common/src/db-code.ts` の `FEATURE_CODE` に `DETAILED_ADVICE: 3` を追加し、`EXPENSE_ANALYSIS`のコメントを「簡易支出分析」に更新
- [ ] 2. `packages/db/src/schema/aiUsageLogs.ts` に `content`（nullable）カラムを追加するマイグレーションを作成
- [ ] 3. `packages/db/src/schema/aiAdviceSessions.ts`・`aiAdviceMessages.ts` を新規作成し、マイグレーションを作成
- [ ] 4. `@google/generative-ai`（公式SDK）を導入
- [ ] 5. `server/routes/transactions/handler.ts`（レシート読み取り）: 画像 + ユーザーのカテゴリ一覧をGeminiに送信し、構造化出力で複数行（商品名・金額・カテゴリ候補）を抽出するエンドポイントを作成。`ai_usage_logs`に記録（1日20回まで）
- [ ] 6. `server/routes/dashboard/handler.ts`（簡易支出分析）: 当日の`ai_usage_logs`（featureCode=2）の有無を確認し、無ければ生成・`content`に保存。1日1回のキャッシュ
- [ ] 7. `server/routes/advice/schema.ts`・`handler.ts`・`index.ts`: セッション作成（トピック選択）→`ai_advice_sessions`+`ai_advice_messages`に保存→Geminiの`generateContentStream`でSSE（`text/event-stream`）逐次レスポンス→ストリーム完了後に全文を`ai_advice_messages`に保存。`ai_usage_logs`で1日5セッションまで制限
- [ ] 8. `server/routes/ai/schema.ts`・`handler.ts`・`index.ts`: `GET /api/ai/usage?featureCode=`を新規作成（[specs/features/ai.md](../../specs/features/ai.md#利用回数の可視化)参照。`RECEIPT_SCAN`・`DETAILED_ADVICE`で当日の`ai_usage_logs`件数から残り回数を計算する共通ロジックを実装）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）
- [ ] 2. レシート読み取りUI（取引登録フォームの「レシートから読み取る」ボタン付近）に`GET /api/ai/usage`を呼び出して「本日の残り◯回」を表示
- [ ] 3. 本格的アドバイス画面のトピック選択UIに同様に「本日の残り◯回」を表示

## クリーンアップ

- [ ] 1. （未定）
