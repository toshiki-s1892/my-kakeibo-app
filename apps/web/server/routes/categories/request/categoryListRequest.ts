import { z } from '@hono/zod-openapi';
import { CATEGORY_TYPE } from '@repo/common';

export const categoryListQuerySchema = z.object({
  typeCode: z.coerce
    .number()
    .pipe(z.enum(CATEGORY_TYPE))
    .openapi({
      param: { name: 'typeCode', in: 'query' },
      example: CATEGORY_TYPE.EXPENSE,
    }),
});
