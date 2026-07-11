import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { categoriesTable } from './categories.js';
import { familyMembersTable } from './familyMembers.js';
import { recurringTransactionsTable } from './recurringTransactions.js';
import { transactionPartiesTable } from './transactionParties.js';
import { usersTable } from './users.js';

// ==========================================
// transactions テーブル
// ==========================================
export const transactionsTable = sqliteTable('transactions', {
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
  transactionDate: text('transaction_date'),
  description: text('description', { length: 255 }),
  partyId: text('party_id').references(() => transactionPartiesTable.id),
  sourceRecurringTransactionId: text('source_recurring_transaction_id').references(
    () => recurringTransactionsTable.id
  ),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
