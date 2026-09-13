import z from 'zod';

export const categoryIdRequestSchema = z.object({
  categoryId: z.uuid().openapi({
    param: { name: 'categoryId', in: 'path' },
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
});
