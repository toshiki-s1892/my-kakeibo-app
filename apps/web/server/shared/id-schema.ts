import z from 'zod';

export const IdParamSchema = z.object({
  id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});

export const IdResponseSchema = z.object({
  id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});
