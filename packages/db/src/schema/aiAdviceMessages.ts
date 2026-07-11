import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { aiAdviceSessionsTable } from './aiAdviceSessions.js';

// ==========================================
// ai_advice_messages テーブル
// ==========================================
export const aiAdviceMessagesTable = sqliteTable('ai_advice_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => aiAdviceSessionsTable.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
