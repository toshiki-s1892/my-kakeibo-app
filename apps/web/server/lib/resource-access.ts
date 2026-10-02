import { ForeignResourceAccessError } from '@/server/shared/error/foreignResourceAccessError';
import { HTTP_STATUS } from '@repo/common';
import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { HTTPException } from 'hono/http-exception';
import { db } from './db';

type TableWithId = SQLiteTable & { id: SQLiteColumn };

// 所有者で絞った検索で対象が見つからなかったときに呼び、404をthrowする。
// レスポンスは「存在しない」「他人のもの」を区別せず同じ404にし、他人のものの場合だけcauseで印を付ける
export const throwResourceNotFound = async (
  table: TableWithId,
  id: string,
  message: string
): Promise<never> => {
  const [foreignResource] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);

  throw new HTTPException(HTTP_STATUS.NOT_FOUND, {
    message,
    cause: foreignResource ? new ForeignResourceAccessError() : undefined,
  });
};
