import { HTTP_STATUS } from '@repo/common';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const validationErrorHook = (
  result:
    | {
        success: true;
        data: unknown;
      }
    | { success: false; error: ZodError }
): Response | void => {
  if (!result.success) {
    throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { cause: result.error });
  }
};
