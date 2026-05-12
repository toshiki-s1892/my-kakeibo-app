import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { categoriesTable } from './categories.js';
import { usersTable } from './users.js';

// ==========================================
// transactions テーブル
// ==========================================
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => usersTable.id, { onDelete: 'restrict' })
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categoriesTable.id)
    .notNull(),
  amount: integer('amount').notNull(),
  transactionDate: text('transaction_date').notNull(),
  memo: text('memo', { length: 255 }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
