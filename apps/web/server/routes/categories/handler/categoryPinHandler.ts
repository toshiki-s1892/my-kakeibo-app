import { UserEnv } from '@/server/lib/auth';
import { db } from '@/server/lib/db';
import { RouteHandler } from '@hono/zod-openapi';
import {
  CATEGORY_TYPE,
  categoryPinTargetInvalidMessage,
  HTTP_STATUS,
  lastPinnedCategoryMessage,
} from '@repo/common';
import { categoriesTable } from '@repo/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { deleteCategoryPinRoute, putCategoryPinRoute } from '../schema/categoryPinSchema';

// EXPENSE側で維持しなければならないピン留めの最小件数
const MIN_PINNED_CATEGORY_COUNT = 1;

// ピン留め処理
export const putCategoryPinHandler: RouteHandler<typeof putCategoryPinRoute, UserEnv> = async (
  c
) => {
  const userId = c.var.userId;
  const { categoryId } = c.req.valid('param');

  // 存在しない・自分のカテゴリでない場合は、対象の有無を第三者に漏らさないため404にする（IDORの再発防止対策）
  const [category] = await db
    .select({
      typeCode: categoriesTable.typeCode,
      parentId: categoriesTable.parentId,
      deletedAt: categoriesTable.deletedAt,
    })
    .from(categoriesTable)
    .where(and(eq(categoriesTable.id, categoryId), eq(categoriesTable.userId, userId)));

  if (!category) {
    throw new HTTPException(HTTP_STATUS.NOT_FOUND, { message: categoryPinTargetInvalidMessage });
  }

  // INCOMEカテゴリ・子カテゴリ・削除済みカテゴリはピン留め不可（業務ルール違反のため400）
  const isPinnable =
    category.typeCode === CATEGORY_TYPE.EXPENSE &&
    category.parentId === null &&
    category.deletedAt === null;

  if (!isPinnable) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: categoryPinTargetInvalidMessage });
  }

  await db
    .update(categoriesTable)
    .set({ isPinned: true })
    .where(and(eq(categoriesTable.userId, userId), eq(categoriesTable.id, categoryId)));

  return c.body(null, HTTP_STATUS.NO_CONTENT);
};

// ピン留め解除処理
export const deleteCategoryPinHandler: RouteHandler<
  typeof deleteCategoryPinRoute,
  UserEnv
> = async (c) => {
  const userId = c.var.userId;
  const { categoryId } = c.req.valid('param');

  const categories = await db
    .select({
      id: categoriesTable.id,
      typeCode: categoriesTable.typeCode,
      parentId: categoriesTable.parentId,
      deletedAt: categoriesTable.deletedAt,
      isPinned: categoriesTable.isPinned,
    })
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, userId));

  // ピン留め解除対象のカテゴリー
  const category = categories.find((category) => category.id === categoryId);

  // 存在しない・自分のカテゴリでない場合は、対象の有無を第三者に漏らさないため404を返す
  if (!category) {
    throw new HTTPException(HTTP_STATUS.NOT_FOUND, { message: categoryPinTargetInvalidMessage });
  }

  // INCOMEカテゴリ・子カテゴリ・削除済みカテゴリはピン留め解除の対象外として400を返す
  const isPinnable =
    category.typeCode === CATEGORY_TYPE.EXPENSE &&
    category.parentId === null &&
    category.deletedAt === null;

  if (!isPinnable) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: categoryPinTargetInvalidMessage });
  }

  // 件数チェックと更新を1つのSQLにまとめる（2段階だと同時リクエストで最後の1件ガードをすり抜けるため）
  const [unpinnedCategory] = await db
    .update(categoriesTable)
    .set({ isPinned: false })
    .where(
      and(
        eq(categoriesTable.userId, userId),
        eq(categoriesTable.id, categoryId),
        sql`(
          ${categoriesTable.isPinned} = false
          OR (
            SELECT COUNT(*)
            FROM ${categoriesTable}
            WHERE
              ${categoriesTable.userId} = ${userId}
              AND ${categoriesTable.typeCode} = ${CATEGORY_TYPE.EXPENSE}
              AND ${categoriesTable.parentId} IS NULL
              AND ${categoriesTable.deletedAt} IS NULL
              AND ${categoriesTable.isPinned} = true
          ) > ${MIN_PINNED_CATEGORY_COUNT}
        )`
      )
    )
    .returning({ id: categoriesTable.id });

  if (!unpinnedCategory) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: lastPinnedCategoryMessage });
  }

  return c.body(null, HTTP_STATUS.NO_CONTENT);
};
