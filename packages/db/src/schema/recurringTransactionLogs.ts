import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { recurringTransactionsTable } from './recurringTransactions.js';
import { transactionsTable } from './transactions.js';

// ==========================================
// recurring_transaction_logs テーブル
// ==========================================
export const recurringTransactionLogsTable = sqliteTable(
  'recurring_transaction_logs',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    recurringTransactionId: text('recurring_transaction_id')
      .notNull()
      .references(() => recurringTransactionsTable.id),
    generatedTransactionId: text('generated_transaction_id').references(() => transactionsTable.id),
    scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('recurring_transaction_log_idx').on(
      table.recurringTransactionId,
      table.scheduledDate
    ),
  ]
);
