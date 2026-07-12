import { getAuth } from '@clerk/hono';
import { RouteHandler } from '@hono/zod-openapi';
import { RELATIONSHIP_CODE } from '@repo/common';
import { categoriesTable, familyMembersTable, usersTable } from '@repo/db/schema';
import { db } from '../../lib/db';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { createUserRoute } from './schema';

export const profileSetupHandler: RouteHandler<typeof createUserRoute> = async (c) => {
  // Clerkの認証情報から userId（clerk_id）を取得
  const { userId } = getAuth(c);

  // リクエストボディのバリデーションと取得
  const body = c.req.valid('json');

  await db.transaction(async (tx) => {
    // Usersテーブルを作成する
    const [user] = await tx
      .insert(usersTable)
      .values({
        clerk_id: userId!,
        regionCode: body.regionCode,
      })
      .returning({ id: usersTable.id });

    if (!user) throw new Error('ユーザーの作成に失敗しました');

    // FamilyMembersテーブルへ本人の情報を追加する
    await tx.insert(familyMembersTable).values({
      userId: user.id,
      name: body.name,
      genderCode: body.genderCode,
      birthday: new Date(body.birthday),
      relationshipCode: RELATIONSHIP_CODE.SELF,
    });

    // 初期カテゴリーを作成する
    await tx
      .insert(categoriesTable)
      .values(DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: user.id })));
  });

  return c.body(null, 204);
};
