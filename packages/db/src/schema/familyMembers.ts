import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// family_members テーブル
// ==========================================
export const familyMembers = sqliteTable('family_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => usersTable.id, { onDelete: 'restrict' })
    .notNull(),
  relationshipCode: integer('relationship_code').notNull(),
  genderCode: integer('gender_code').notNull(),
  birthYear: integer('birth_year').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
