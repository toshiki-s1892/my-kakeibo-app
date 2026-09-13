import { z } from '@hono/zod-openapi';
import { CATEGORY_COLOR_CODE, CATEGORY_ICON_CODE, CATEGORY_TYPE } from '@repo/common';
import { selectCategorySchema } from '@repo/db/schema';

// 親カテゴリ
export const categorySchema = selectCategorySchema
  .extend({
    id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    typeCode: z.enum(CATEGORY_TYPE).openapi({ example: CATEGORY_TYPE.EXPENSE }),
    name: z.string().openapi({ example: '食費' }),
    icon: z.enum(CATEGORY_ICON_CODE).openapi({ example: CATEGORY_ICON_CODE.UTENSILS }),
    color: z.enum(CATEGORY_COLOR_CODE).openapi({ example: CATEGORY_COLOR_CODE.ORANGE }),
    isPinned: z.boolean().openapi({ example: true }),
  })
  .openapi('Category');

// 子カテゴリ
export const childCategorySchema = categorySchema.omit({ isPinned: true }).openapi('ChildCategory');

export const categoryWithChildrenSchema = categorySchema
  .extend({
    children: z.array(childCategorySchema),
  })
  .openapi('CategoryWithChildren');
