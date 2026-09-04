import {
  unauthorizedErrorMessage,
  unexpectedErrorMessage,
  validationErrorMessage,
} from '@repo/common';
import { errorResponseSchema } from './errorResponseSchema';

// 全エンドポイント共通: 認証されていない場合（401）
export const unauthorizedResponse = {
  description: '認証されていない場合',
  content: {
    'application/json': {
      schema: errorResponseSchema,
      examples: {
        unauthorized: {
          summary: '未認証の場合',
          value: { message: unauthorizedErrorMessage },
        },
      },
    },
  },
} as const;

// 全エンドポイント共通: 予期しないサーバーエラー（500）
export const internalServerErrorResponse = {
  description: 'サーバーエラー',
  content: {
    'application/json': {
      schema: errorResponseSchema,
      examples: {
        unexpected: {
          summary: '予期しないエラーの場合',
          value: { message: unexpectedErrorMessage },
        },
      },
    },
  },
} as const;

// リクエストのバリデーションエラー（400）。defaultHook（validationErrorHook）が
// ZodErrorをcauseにHTTPExceptionをthrowした場合に共通で使う
export const validationErrorResponse = {
  description: 'リクエストのバリデーションエラー',
  content: {
    'application/json': {
      schema: errorResponseSchema,
      examples: {
        validation: {
          summary: 'バリデーションエラーの場合',
          value: {
            message: validationErrorMessage,
            details: [{ field: 'name', message: '入力してください' }],
          },
        },
      },
    },
  },
} as const;
