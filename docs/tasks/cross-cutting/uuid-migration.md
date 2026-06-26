# ID設計のUUID化

方針の詳細は [stack.md](../../architecture/decisions/stack.md#id設計-uuid全テーブル共通) を参照。

## バックエンド

- [ ] 1. `packages/db/src/schema/*.ts` の全テーブル（`users`・`categories`・`family_members`・`transactions`・`ai_usage_logs`）のPKを `integer autoIncrement` から `text`（`crypto.randomUUID()`生成）に変更
- [ ] 2. 上記に伴うマイグレーションを作成
- [ ] 3. `server/shared/id-schema.ts` の `IdParamSchema`・`IdResponseSchema` を `z.coerce.number()` からUUID文字列のバリデーション（`z.string().uuid()`）に変更
- [ ] 4. 既存実装（プロフィール設定機能: `server/routes/profile/handler.ts` 等）でID型に依存している箇所がないか確認・修正
- [ ] 5. 全エンドポイントで所有者チェック（`WHERE id = :id AND user_id = auth.userId`）が入っていることを確認（[セキュリティ対応方針](../../architecture/decisions/security.md#idor不正な直接オブジェクト参照対策)）
