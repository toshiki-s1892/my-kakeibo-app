import { errorResponseSchema } from '@/server/shared/error';
import { createRoute } from '@hono/zod-openapi';
import { categoryIdRequestSchema } from '../request/categoryIdRequest';

export const putCategoryPinRoute = createRoute({
  method: 'put',
  path: '/{categoryId}/pin',
  tags: ['Categories'],
  summary: 'カテゴリーをピン留め状態へ更新',
  description: 'カテゴリーをピン留め状態へ更新するエンドポイントです。',
  request: {
    params: categoryIdRequestSchema,
  },
  responses: {
    204: {
      description: 'ピン留めに成功した場合',
    },
    400: {
      description: 'INCOMEカテゴリまたは子カテゴリへのピン留めを試みた場合',
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

export const deleteCategoryPinRoute = createRoute({
  method: 'delete',
  path: '/{categoryId}/pin',
  tags: ['Categories'],
  summary: 'カテゴリーのピン留め状態を解除',
  description: 'カテゴリーのピン留め状態を解除するエンドポイントです。',
  request: {
    params: categoryIdRequestSchema,
  },
  responses: {
    204: {
      description: 'ピン留め解除に成功した場合',
    },
    400: {
      description:
        'INCOMEカテゴリまたは子カテゴリを指定した場合（ピン留め不可のカテゴリのため）。または自分のEXPENSEカテゴリでピン留めが最後の1件の場合（解除すると0件になるため）',
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
