import { errorResponseSchema } from '@/server/shared/error/errorResponseSchema';
import {
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/server/shared/error/errorResponses';
import { createRoute } from '@hono/zod-openapi';
import { categoryPinTargetInvalidMessage, lastPinnedCategoryMessage } from '@repo/common';
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
      description:
        '指定されたカテゴリが存在しない・自分のカテゴリでない場合。またはINCOMEカテゴリまたは子カテゴリへのピン留めを試みた場合',
      content: {
        'application/json': {
          schema: errorResponseSchema,
          examples: {
            targetInvalid: {
              summary: '対象カテゴリが存在しない・ピン留め不可な場合',
              value: { message: categoryPinTargetInvalidMessage },
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
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
        '指定されたカテゴリが存在しない・自分のカテゴリでない場合。またはINCOMEカテゴリまたは子カテゴリを指定した場合（ピン留め不可のカテゴリのため）。または自分のEXPENSEカテゴリでピン留めが最後の1件の場合（解除すると0件になるため）',
      content: {
        'application/json': {
          schema: errorResponseSchema,
          examples: {
            targetInvalid: {
              summary: '対象カテゴリが存在しない・ピン留め解除不可な場合',
              value: { message: categoryPinTargetInvalidMessage },
            },
            lastPinned: {
              summary: 'ピン留めが最後の1件の場合',
              value: { message: lastPinnedCategoryMessage },
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
});
