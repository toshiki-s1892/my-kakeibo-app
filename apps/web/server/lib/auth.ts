import { getAuth } from '@clerk/hono';
import { HTTP_STATUS, unauthorizedErrorMessage } from '@repo/common';
import { usersTable } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { db } from './db';

type ClerkVariables = { clerkId: string };
export type AuthEnv = { Variables: ClerkVariables };

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json(
      {
        message: unauthorizedErrorMessage,
      },
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  c.set('clerkId', userId);
  await next();
});

type UserVariables = ClerkVariables & { userId: string };
export type UserEnv = { Variables: UserVariables };

export const requireUserMiddleware = createMiddleware<UserEnv>(async (c, next) => {
  const clerkId = c.var.clerkId;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerk_id, clerkId));

  if (!user) {
    return c.json({ message: unauthorizedErrorMessage }, HTTP_STATUS.UNAUTHORIZED);
  }

  c.set('userId', user.id);
  await next();
});
