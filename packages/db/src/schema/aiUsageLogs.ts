import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// ai_usage_logs テーブル
// ==========================================
export const aiUsageLogsTable = sqliteTable('ai_usage_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  userId: integer('user_id')
    .references(() => usersTable.id, { onDelete: 'restrict' })
    .notNull(),
  featureCode: integer('feature_code').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
