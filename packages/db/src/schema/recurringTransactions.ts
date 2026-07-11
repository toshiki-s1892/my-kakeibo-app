import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { categoriesTable } from './categories.js';
import { familyMembersTable } from './familyMembers.js';
import { usersTable } from './users.js';

// ==========================================
// recurring_transactions テーブル
// ==========================================
export const recurringTransactionsTable = sqliteTable('recurring_transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  familyMemberId: text('family_member_id')
    .notNull()
    .references(() => familyMembersTable.id, { onDelete: 'restrict' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => categoriesTable.id),
  amount: integer('amount').notNull(),
  frequencyCode: integer('frequency_code').notNull(),
  recurringMonth: integer('recurring_month'),
  recurringDay: integer('recurring_day').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  description: text('description', { length: 255 }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});
