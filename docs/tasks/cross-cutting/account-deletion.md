# 退会時の完全削除

方針の詳細は [security.mdの退会時の完全削除](../../architecture/decisions/security.md#退会時の完全削除2026-08-23決定) を参照。

## バックエンド

- [ ] 1. Clerkダッシュボードでアカウント削除機能を有効化する（`UserProfile`から退会操作ができるようにする。アプリ側の削除UI・削除APIは自前で実装しない）
- [ ] 2. Clerkの`user.deleted` Webhookを受け取るエンドポイントを実装する（[Clerk公式のWebhook設定](https://clerk.com/docs)を確認し、署名検証を行う）
- [ ] 3. Webhook受信時、該当`clerk_id`に紐づく`users.id`を特定し、以下を子→親の順にハード削除する
  - `ai_advice_messages`（`ai_advice_sessions`経由）
  - `ai_advice_sessions`
  - `ai_usage_logs`
  - `recurring_transaction_logs`（`recurring_transactions`経由）
  - `recurring_transactions`
  - `transactions`
  - `transaction_parties`
  - `family_members`
  - `categories`
  - `users`本体
- [ ] 4. 削除処理はトランザクション内で実行し、途中失敗時に中途半端な削除が残らないようにする

## フロントエンド

- [ ] 1. （フロントエンド実装なし。退会操作はClerkの`UserProfile`が提供するUIに任せる）

## クリーンアップ

- [ ] 1. （未定）
