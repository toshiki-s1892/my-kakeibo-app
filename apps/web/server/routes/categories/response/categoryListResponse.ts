import { z } from '@hono/zod-openapi';
import { categoryWithChildrenSchema } from './categoryResponse';

// カテゴリー一覧取得レスポンス
export const categoryListResponseSchema = z.object({
  categories: z.array(categoryWithChildrenSchema),
});
