import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';

// ==========================================
// categories テーブル
// ==========================================
export const categoriesTable = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id', { length: 50 })
    .references(() => usersTable.id, { onDelete: 'restrict' })
    .notNull(),
  typeCode: integer('type_code').notNull(),
  name: text('name', { length: 50 }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
