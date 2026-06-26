# データベース

## DBスキーマ

ER図は [schema.dbml](./schema.dbml) で管理する（[dbdiagram.io](https://dbdiagram.io)で読み込み可能。レイアウトは[schema.dbdiagram](./schema.dbdiagram)）。**DB変更を伴う仕様が確定したら、その都度`schema.dbml`を更新する**（実装前の確定仕様も反映する。各機能の実装タスクは`docs/tasks/features/{feature名}.md`で別途管理）。

主キーは全テーブル共通でUUID（`text`型）を採用している（採用理由は[decisions/stack.md](./decisions/stack.md#id設計-uuid全テーブル共通)参照）。

```
users
  id, clerk_id, regionCode, createdAt, updatedAt, deletedAt

categories
  id, userId → users.id（NULL = システムデフォルト）, typeCode, name
  parentId → categories.id（自己参照・1階層のみ。グラフ集計時に子の金額を親に合算する）
  createdAt, deletedAt

category_pins
  id, userId → users.id, categoryId → categories.id, createdAt
  ※ デフォルトカテゴリは全ユーザー共有の1行のため、ピン留め（ダッシュボードのグラフで常に表示）はcategories側にフラグを持たせず中間テーブルで管理する
  ※ (userId, categoryId) に一意制約。行が存在する=ピン留めしている

transactions
  id, userId → users.id, familyMemberId → family_members.id
  categoryId → categories.id
  amount, transactionDate, memo
  sourceRecurringTransactionId → recurring_transactions.id（NULL可。定期取引から自動生成された場合のみ）
  createdAt, updatedAt

family_members
  id, userId → users.id
  name, relationshipCode（1:本人 2:配偶者 3:子 4:親 5:その他）, genderCode, birthday
  isDefault（ユーザーごとに1件のみtrue。取引記録フォームの初期選択に使う）
  createdAt, deletedAt

ai_usage_logs
  id, userId → users.id, featureCode（1:レシート読み取り 2:簡易支出分析 3:本格的アドバイス）
  content（NULL可。featureCode=2の1日1回キャッシュに使う）
  familyMemberId → family_members.id（NULL可。featureCode=2でメンバーごとにキャッシュするためのキー）
  createdAt

ai_advice_sessions
  id, userId → users.id, topic, createdAt

ai_advice_messages
  id, sessionId → ai_advice_sessions.id, role（user/assistant）, content, createdAt

recurring_transactions
  id, userId → users.id, familyMemberId → family_members.id, categoryId → categories.id
  amount, frequencyCode（1:毎月 2:毎年）, recurringMonth（毎年のみ使用）, recurringDay
  startDate, endDate（NULL可）, memo, createdAt, deletedAt

recurring_transaction_logs
  id, recurringTransactionId → recurring_transactions.id, scheduledDate
  generatedTransactionId → transactions.id（NULL可。生成済みの取引が削除されてもログ行は残す）
  createdAt
  ※ (recurringTransactionId, scheduledDate) に一意制約（Cronの二重実行による重複生成を防ぐ）
```

## 命名規則

Drizzleのテーブル変数は`usersTable`・`familyMembersTable`のように`Table`サフィックスをつける（`packages/db/src/schema/*.ts`）。

## マイグレーション管理

`packages/db/migrations/` に SQL マイグレーションファイルを管理。  
`packages/db/drizzle.config.ts` で設定。

詳細な手順は `db-migrate` スキルを参照。
