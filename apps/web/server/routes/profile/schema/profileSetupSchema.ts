import { errorResponseSchema } from '@/server/shared/error/errorResponseSchema';
import {
  internalServerErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/server/shared/error/errorResponses';
import { createRoute } from '@hono/zod-openapi';
import { alreadySetupMessage } from '@repo/common';
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
    400: validationErrorResponse,
    401: unauthorizedResponse,
    409: {
      description: 'すでにプロフィールが登録されている場合',
      content: {
        'application/json': {
          schema: errorResponseSchema,
          examples: {
            alreadySetup: {
              summary: 'すでにプロフィールが登録されている場合',
              value: { message: alreadySetupMessage },
            },
          },
        },
      },
    },
    500: internalServerErrorResponse,
  },
});
