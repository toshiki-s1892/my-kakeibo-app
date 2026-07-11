import { sql } from 'drizzle-orm';
import { AnySQLiteColumn, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// categories テーブル
// ==========================================
export const categoriesTable = sqliteTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict' }),
    typeCode: integer('type_code').notNull(),
    name: text('name', { length: 50 }).notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    parentId: text('parent_id').references((): AnySQLiteColumn => categoriesTable.id),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('categories_user_type_name_idx')
      .on(table.userId, table.typeCode, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);
