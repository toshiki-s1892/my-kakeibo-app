import { ForeignResourceAccessError } from '@/server/shared/error/customErrors';
import { getAuth } from '@clerk/hono';
import { HTTP_STATUS, unexpectedErrorMessage, validationErrorMessage } from '@repo/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const errorHandler = (error: Error, c: Context) => {
  if (error instanceof HTTPException && error.cause instanceof ZodError) {
    const details = error.cause.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return c.json({ message: validationErrorMessage, details }, HTTP_STATUS.BAD_REQUEST);
  }

  if (error instanceof HTTPException) {
    // 他ユーザーのリソースを指定した404だけを記録する（存在しないIDの404は正規ユーザーの通常操作でも起きるため除く）
    if (error.cause instanceof ForeignResourceAccessError) {
      c.var.logger.warn(
        { event: 'malicious_direct_reference', userId: getAuth(c)?.userId },
        'IDOR試行の疑い'
      );
    }
    return c.json({ message: error.message }, error.status);
  }

  if (error instanceof DrizzleQueryError) {
    c.var.logger.error(
      { userId: getAuth(c)?.userId, query: error.query, causeMessage: error.cause?.message },
      'DBクエリ失敗'
    );
  } else {
    c.var.logger.error(
      {
        userId: getAuth(c)?.userId,
        errorMessage: error.message,
        stack: error.stack,
      },
      '想定外エラー'
    );
  }

  return c.json({ message: unexpectedErrorMessage }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
