import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ==========================================
// users テーブル
// ==========================================
export const usersTable = sqliteTable('users', {
  id: text('id', { length: 50 }).primaryKey(), // Clerk等のIDが入る想定
  regionCode: integer('region_code').notNull(),
  genderCode: integer('gender_code').notNull(),
  birthYear: integer('birth_year').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});
