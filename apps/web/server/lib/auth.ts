import { getAuth } from '@clerk/hono';
import { HTTP_STATUS, unauthorizedErrorMessage } from '@repo/common';
import { createMiddleware } from 'hono/factory';

export type AuthEnv = { Variables: Variables };
type Variables = { userId: string };

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json(
      {
        message: unauthorizedErrorMessage,
      },
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  c.set('userId', userId);
  await next();
});
