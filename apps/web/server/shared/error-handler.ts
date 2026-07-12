import { getAuth } from '@clerk/hono';
import { HTTP_STATUS, unexpectedErrorMessage, validationErrorMessage } from '@repo/common';
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
    return c.json({ message: error.message }, error.status);
  }

  console.error({ userId: getAuth(c)?.userId, path: c.req.path, error });

  return c.json({ message: unexpectedErrorMessage }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
