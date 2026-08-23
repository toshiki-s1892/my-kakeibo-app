import { errorResponseSchema } from '@/server/shared/error';
import { createRoute } from '@hono/zod-openapi';
import { userSetupRequestSchema } from '../request/profileSetupRequest';

export const createUserRoute = createRoute({
  method: 'post',
  path: '/setup',
  tags: ['Profile'],
  summary: 'ユーザープロフィールの作成',
  description: 'ユーザープロフィールを作成するエンドポイントです。',
  request: {
    body: { content: { 'application/json': { schema: userSetupRequestSchema } } },
  },
  responses: {
    204: {
      description: 'プロフィールが正常に作成された場合',
    },
    400: {
      description: 'リクエストのバリデーションエラー',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: '認証されていない場合',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'すでにプロフィールが登録されている場合',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'サーバーエラー',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
