# データベース

## DBスキーマ

ER図は [schema.dbml](./schema.dbml) で管理する（[dbdiagram.io](https://dbdiagram.io)で読み込み可能。レイアウトは[schema.dbdiagram](./schema.dbdiagram)）。**DB変更を伴う仕様が確定したら、その都度`schema.dbml`を更新する**（実装前の確定仕様も反映する。各機能の実装タスクは`docs/tasks/features/{feature名}.md`で別途管理）。

主キーは全テーブル共通でUUID（`text`型）を採用している（採用理由は[decisions/stack.md](./decisions/stack.md#id設計-uuid全テーブル共通)参照）。

```
users
  id, clerk_id, regionCode, createdAt, updatedAt, deletedAt

categories
  id, userId → users.id（NOT NULL。全カテゴリは必ず特定ユーザーの所有。プロフィールセットアップ完了時に初期カテゴリ16件がそのユーザーのuserIdでコピー作成される。詳細はspecs/features/categories.md参照）, typeCode, name
  icon（lucide-reactのアイコン名）, color（キュレーションした色キー）
  parentId → categories.id（自己参照・1階層のみ。グラフ集計時に子の金額を親に合算する）
  isPinned（boolean、NOT NULL、デフォルトfalse。EXPENSE側のみ意味を持つ。ダッシュボードの円グラフで常に表示するための固定表示フラグ。各ユーザーが自分専用の行を持つため中間テーブルを介さずカテゴリ自体に直接持たせられる）
  createdAt, deletedAt
  ※ (userId, typeCode, name) に部分一意制約（deletedAt IS NULLの行のみ対象。論理削除済みの名前は再利用可能にするため）。自分の既存カテゴリ同士の重複に対するDB側の防御層（competing requestによる事故防止）

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

## マイグレーション運用・履歴

- 適用は `drizzle-kit generate` → `drizzle-kit migrate` で行う（2026-07-20に`push`運用から変更。理由と経緯は[decisions/stack.md](./decisions/stack.md#マイグレーション運用drizzle-kit-generate--migrate2026-07-20にpush運用から変更)参照）
- **2026-07-20にマイグレーション履歴をスカッシュ**し、`0000_acoustic_terror.sql`（全10テーブルのベースライン1本）に一本化した
  - 経緯: 結合テスト基盤が`migrate()`で履歴を空DBに再生したところ、旧12ファイル中4ファイルが再生不能だった。原因はdrizzle-kitがテーブル再作成SQL（`CREATE TABLE __new_x` → `INSERT INTO ... SELECT` → `DROP`/`RENAME`）の`SELECT`リストに「そのマイグレーション自身で追加した列」を含めてしまう挙動（旧テーブルに存在しない列のため`no such column`で失敗する）
  - 適用済みファイルの手修正は「ファイル内容と実際に実行されたSQLの乖離」を生むため不採用とし、本番リリース前でTursoのデータが使い捨て可能な今のうちに、全テーブル削除→ベースライン再適用でクリーンな履歴に作り直した

## 命名規則

Drizzleのテーブル変数は`usersTable`・`familyMembersTable`のように`Table`サフィックスをつける（`packages/db/src/schema/*.ts`）。

## マイグレーション管理

`packages/db/migrations/` に SQL マイグレーションファイルを管理。  
`packages/db/drizzle.config.ts` で設定。

詳細な手順は `db-migrate` スキルを参照。
