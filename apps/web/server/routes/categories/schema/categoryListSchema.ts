import {
  internalServerErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/server/shared/error/errorResponses';
import { createRoute } from '@hono/zod-openapi';
import { CATEGORY_COLOR_CODE, CATEGORY_ICON_CODE, CATEGORY_TYPE } from '@repo/common';
import { categoryListQuerySchema } from '../request/categoryListRequest';
import { categoryListResponseSchema } from '../response/categoryListResponse';

export const getCategoriesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Categories'],
  summary: 'カテゴリー一覧取得',
  description: 'カテゴリー一覧を取得するエンドポイントです。',
  request: { query: categoryListQuerySchema },
  responses: {
    200: {
      description: 'カテゴリー一覧を取得できた場合',
      content: {
        'application/json': {
          schema: categoryListResponseSchema,
          examples: {
            withData: {
              summary: 'カテゴリーが存在する場合',
              value: {
                categories: [
                  {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    typeCode: CATEGORY_TYPE.EXPENSE,
                    name: '食費',
                    icon: CATEGORY_ICON_CODE.UTENSILS,
                    color: CATEGORY_COLOR_CODE.ORANGE,
                    parentId: null,
                    isPinned: true,
                    children: [],
                  },
                  {
                    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                    typeCode: CATEGORY_TYPE.EXPENSE,
                    name: '光熱費',
                    icon: CATEGORY_ICON_CODE.LIGHTBULB,
                    color: CATEGORY_COLOR_CODE.YELLOW,
                    parentId: null,
                    isPinned: true,
                    children: [
                      {
                        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c9',
                        typeCode: CATEGORY_TYPE.EXPENSE,
                        name: '電気代',
                        icon: CATEGORY_ICON_CODE.LIGHTBULB,
                        color: CATEGORY_COLOR_CODE.YELLOW,
                        parentId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                      },
                      {
                        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c0',
                        typeCode: CATEGORY_TYPE.EXPENSE,
                        name: '水道代',
                        icon: CATEGORY_ICON_CODE.LIGHTBULB,
                        color: CATEGORY_COLOR_CODE.INDIGO,
                        parentId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
                      },
                    ],
                  },
                ],
              },
            },
            empty: {
              summary: 'カテゴリーが0件の場合',
              value: { categories: [] },
            },
          },
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
});
