# 定期取引

仕様の詳細は [specs/features/recurring-transactions.md](../../specs/features/recurring-transactions.md) を参照。

## バックエンド

- [ ] 1. `packages/db/src/schema/recurringTransactions.ts` を新規作成（テンプレートテーブル）し、マイグレーションを作成
  - `familyMemberId`・`categoryId`・`amount`・`frequencyCode`・`recurringMonth`（nullable）・`recurringDay`・`startDate`・`endDate`（nullable）・`memo`・`deletedAt`
- [ ] 2. `packages/db/src/schema/transactions.ts` に `sourceRecurringTransactionId`（nullable）カラムを追加するマイグレーションを作成
- [ ] 3. `packages/db/src/schema/recurringTransactionLogs.ts` を新規作成（処理済みログ。`recurringTransactionId`+`scheduledDate`に一意制約）し、マイグレーションを作成
- [ ] 4. `packages/common/src/db-code.ts` に `FREQUENCY_TYPE`（`MONTHLY: 1`・`YEARLY: 2`）を追加
- [ ] 5. `server/routes/recurring-transactions/schema.ts`・`handler.ts`・`index.ts` を作成（GET/POST/PUT/DELETE、自分のテンプレートのみ）
- [ ] 6. `app/api/cron/recurring-transactions/route.ts` を作成（Vercel Cron Jobsから1日1回呼び出される。①`recurring_transaction_logs`へのINSERTで冪等性を確保→②成功時のみ`transactions`を生成→③`generatedTransactionId`を更新）
- [ ] 7. `vercel.json` に `crons` 設定を追加（[Vercel公式ドキュメント](https://vercel.com/docs/cron-jobs)参照）
- [ ] 8. `CRON_SECRET` 環境変数を設定し、cronエンドポイントの認証に使用する
- [ ] 9. カテゴリ・家族メンバーのDELETE実装時に、紐づくテンプレートを連動して論理削除する処理が入っていることを確認（[tasks/categories.md](./categories.md)・[tasks/family-members.md](./family-members.md)側のタスク）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）

## クリーンアップ

- [ ] 1. （未定）
