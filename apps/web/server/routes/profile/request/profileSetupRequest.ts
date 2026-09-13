import { z } from '@hono/zod-openapi';
import { GENDER_CODE } from '@repo/common';

export const userSetupRequestSchema = z.object({
  name: z.string().min(1).max(50).openapi({ example: '山田太郎' }),
  genderCode: z.enum(GENDER_CODE).openapi({ example: 1 }),
  birthday: z.iso.datetime().openapi({ example: '2000-01-01T00:00:00Z' }),
  regionCode: z.number().int().min(1).max(47).openapi({ example: 13 }),
});
