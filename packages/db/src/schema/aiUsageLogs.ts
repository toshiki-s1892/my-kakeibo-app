import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { familyMembersTable } from './familyMembers.js';
import { usersTable } from './users.js';

// ==========================================
// ai_usage_logs テーブル
// ==========================================
export const aiUsageLogsTable = sqliteTable('ai_usage_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  featureCode: integer('feature_code').notNull(),
  familyMemberId: text('family_member_id').references(() => familyMembersTable.id, {
    onDelete: 'restrict',
  }),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
