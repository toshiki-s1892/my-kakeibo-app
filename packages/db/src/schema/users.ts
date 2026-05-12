import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';

// ==========================================
// users テーブル
// ==========================================
export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clerk_id: text('clerk_id').unique().notNull(),
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

/**
 * ユーザーの取得スキーマ
 */
export const selectUserSchema = createInsertSchema(usersTable);

/**
 * ユーザーの登録スキーマ
 */
export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
