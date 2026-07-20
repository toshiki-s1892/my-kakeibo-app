import { createRoute } from '@hono/zod-openapi';
import { GENDER_CODE } from '@repo/common';
import z from 'zod';
import { ErrorResponseSchema } from '../../shared/error';

// ユーザープロフィール作成リクエストのスキーマ
const UserSetupRequestSchema = z.object({
  name: z.string().min(1).max(50).openapi({ example: '山田太郎' }),
  genderCode: z.enum(GENDER_CODE).openapi({ example: 1 }),
  birthday: z.iso.datetime().openapi({ example: '2000-01-01T00:00:00Z' }),
  regionCode: z.number().int().min(1).max(47).openapi({ example: 13 }),
});

export const createUserRoute = createRoute({
  method: 'post',
  path: '/setup',
  tags: ['Profile'],
  summary: 'ユーザープロフィールの作成',
  description: 'ユーザープロフィールを作成するエンドポイントです。',
  request: {
    body: { content: { 'application/json': { schema: UserSetupRequestSchema } } },
  },
  responses: {
    204: {
      description: 'プロフィールが正常に作成された場合',
    },
    400: {
      description: 'リクエストのバリデーションエラー',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: '認証されていない場合',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'すでにプロフィールが登録されている場合',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'サーバーエラー',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
