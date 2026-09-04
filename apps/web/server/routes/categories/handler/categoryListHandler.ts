import { AuthEnv } from '@/server/lib/auth';
import { db } from '@/server/lib/db';
import { RouteHandler } from '@hono/zod-openapi';
import { categoriesTable } from '@repo/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { categoryListResponseSchema } from '../response/categoryListResponse';
import { getCategoriesRoute } from '../schema/categoryListSchema';

export const getCategoriesHandler: RouteHandler<typeof getCategoriesRoute, AuthEnv> = async (c) => {
  // Clerkの認証情報から userId（clerk_id）を取得
  const userId = c.var.userId;
  const { typeCode } = c.req.valid('query');

  const categoryRows = await db
    .select({
      id: categoriesTable.id,
      typeCode: categoriesTable.typeCode,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      color: categoriesTable.color,
      isPinned: categoriesTable.isPinned,
      parentId: categoriesTable.parentId,
    })
    .from(categoriesTable)
    .where(
      and(
        eq(categoriesTable.userId, userId),
        eq(categoriesTable.typeCode, typeCode),
        isNull(categoriesTable.deletedAt)
      )
    )
    .orderBy(desc(categoriesTable.isPinned), desc(categoriesTable.createdAt));

  type CategoryRow = (typeof categoryRows)[number];

  const parentRows: CategoryRow[] = [];
  const childrenByParentId = new Map<string, CategoryRow[]>();

  // カテゴリーの親子関係を整理
  for (const row of categoryRows) {
    if (row.parentId === null) {
      parentRows.push(row);
      continue;
    }

    const children = childrenByParentId.get(row.parentId);
    if (children) {
      children.push(row);
    } else {
      childrenByParentId.set(row.parentId, [row]);
    }
  }

  const categories = parentRows.map((row) => ({
    ...row,
    children: childrenByParentId.get(row.id) ?? [],
  }));

  const response = categoryListResponseSchema.parse({ categories });
  return c.json(response, 200);
};
