import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// ai_advice_sessions テーブル
// ==========================================

export const aiAdviceSessionsTable = sqliteTable('ai_advice_sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  topic: integer('topic').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
