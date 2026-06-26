# 家族構成管理

仕様の詳細は [specs/features/family-members.md](../../specs/features/family-members.md) を参照。

## バックエンド

- [ ] 1. `packages/db/src/schema/familyMembers.ts` に `isDefault`（boolean）カラムを追加するマイグレーションを作成
  - プロフィール設定時に作成される「本人」レコードは`isDefault = true`で作成する（[profile-setup.md](../../specs/features/profile-setup.md)側の実装も要修正）
- [ ] 2. `server/routes/family-members/schema.ts`・`handler.ts`・`index.ts` を作成
  - GET `/api/family-members`
  - POST `/api/family-members`
  - PUT `/api/family-members/:id`（`relationship_code`はリクエストスキーマに含めない）
  - PATCH `/api/family-members/:id/default`（対象を`isDefault=true`、他の自分のメンバーを`isDefault=false`に更新するトランザクション処理）
  - DELETE `/api/family-members/:id`（論理削除。`relationship_code=SELF`は403。デフォルトメンバーが削除された場合は本人に自動フォールバック。紐づく`recurring_transactions`テンプレートも連動して論理削除）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）

## クリーンアップ

- [ ] 1. （未定）
