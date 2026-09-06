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
import { and, eq, isNull } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { deleteCategoryPinRoute, putCategoryPinRoute } from '../schema/categoryPinSchema';

// ピン留め処理
export const putCategoryPinHandler: RouteHandler<typeof putCategoryPinRoute, UserEnv> = async (
  c
) => {
  const userId = c.var.userId;
  const { categoryId } = c.req.valid('param');

  const [pinnedCategory] = await db
    .update(categoriesTable)
    .set({ isPinned: true })
    .where(
      and(
        eq(categoriesTable.userId, userId),
        eq(categoriesTable.id, categoryId),
        eq(categoriesTable.typeCode, CATEGORY_TYPE.EXPENSE),
        isNull(categoriesTable.parentId),
        isNull(categoriesTable.deletedAt)
      )
    )
    .returning({ id: categoriesTable.id });

  if (!pinnedCategory) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: categoryPinTargetInvalidMessage });
  }

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
      isPinned: categoriesTable.isPinned,
    })
    .from(categoriesTable)
    .where(
      and(
        eq(categoriesTable.userId, userId),
        eq(categoriesTable.typeCode, CATEGORY_TYPE.EXPENSE),
        isNull(categoriesTable.parentId),
        isNull(categoriesTable.deletedAt)
      )
    );

  // ピン留め解除対象のカテゴリー
  const category = categories.find((category) => category.id === categoryId);

  if (!category) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: categoryPinTargetInvalidMessage });
  }

  const pinnedCount = categories.filter((category) => category.isPinned).length;

  if (category.isPinned && pinnedCount <= 1) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { message: lastPinnedCategoryMessage });
  }

  await db
    .update(categoriesTable)
    .set({ isPinned: false })
    .where(and(eq(categoriesTable.userId, userId), eq(categoriesTable.id, categoryId)));

  return c.body(null, HTTP_STATUS.NO_CONTENT);
};
