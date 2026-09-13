import z from 'zod';

export const errorResponseSchema = z.object({
  message: z.string().openapi({ example: 'エラーメッセージ' }),
  details: z
    .array(
      z.object({
        field: z.string().openapi({ example: 'エラーが発生したフィールド名' }),
        message: z.string().openapi({ example: 'フィールドに関するエラーメッセージ' }),
      })
    )
    .optional(),
});
