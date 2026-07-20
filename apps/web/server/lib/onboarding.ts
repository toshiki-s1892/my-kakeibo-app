import { usersTable } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { db } from './db';

// clerk登録済みのユーザーがセットアップ登録済みか判定
export const isSetupComplete = async (userId: string): Promise<boolean> => {
  const user = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerk_id, userId));

  // ユーザーが存在するかどうかを返す
  return user.length > 0;
};
