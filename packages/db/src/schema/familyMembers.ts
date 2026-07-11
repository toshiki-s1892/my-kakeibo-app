import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.js';

// ==========================================
// family_members テーブル
// ==========================================
export const familyMembersTable = sqliteTable('family_members', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  name: text('name', { length: 50 }).notNull(),
  relationshipCode: integer('relationship_code').notNull(),
  genderCode: integer('gender_code').notNull(),
  birthday: integer('birthday', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});
