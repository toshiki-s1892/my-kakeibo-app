import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// transaction_parties テーブル
// ==========================================
export const transactionPartiesTable = sqliteTable('transaction_parties', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  typeCode: integer('type_code').notNull(),
  name: text('name', { length: 50 }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});
