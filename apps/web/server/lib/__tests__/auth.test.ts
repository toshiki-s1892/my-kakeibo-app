import { AuthEnv, UserEnv } from '@/server/lib/auth';
import { unauthorizedErrorMessage } from '@repo/common';
import { usersTable } from '@repo/db/schema';
import { Hono } from 'hono';

// clerk認証のmock化
const { mockClerkId } = vi.hoisted(() => ({
  mockClerkId: { current: 'test-clerk-id' as string | null },
}));

vi.mock('@clerk/hono', () => ({
  getAuth: () => ({ userId: mockClerkId.current }),
}));

describe('authMiddleware', () => {
  let app: Hono<AuthEnv>;

  beforeEach(async () => {
    mockClerkId.current = 'test-clerk-id';

    const { authMiddleware } = await import('@/server/lib/auth');
    app = new Hono<AuthEnv>();
    app.use('*', authMiddleware);
    app.get('/', (c) => c.json({ clerkId: c.var.clerkId }));
  });

  describe('正常系', () => {
    test('clerkからユーザー情報が取得できる場合はclerkIdをセットして次に進む', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ clerkId: 'test-clerk-id' });
    });
  });

  describe('異常系', () => {
    test('clerkからユーザー情報が取得できない場合は401エラーが返る', async () => {
      mockClerkId.current = null;

      const res = await app.request('/');
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: unauthorizedErrorMessage });
    });
  });
});

describe('requireUserMiddleware', () => {
  let app: Hono<UserEnv>;

  beforeEach(async () => {
    mockClerkId.current = 'test-clerk-id';

    const { authMiddleware, requireUserMiddleware } = await import('@/server/lib/auth');
    app = new Hono<UserEnv>();
    app.use('*', authMiddleware, requireUserMiddleware);
    app.get('/', (c) => c.json({ userId: c.var.userId }));
  });

  describe('正常系', () => {
    test('clerkIdに紐づくユーザーが存在する場合はuserIdをセットして次に進む', async () => {
      const { db } = await import('@/server/lib/db');
      const [user] = await db
        .insert(usersTable)
        .values({ clerk_id: 'test-clerk-id', regionCode: 13 })
        .returning({ id: usersTable.id });

      if (!user) throw new Error('テストユーザーの作成に失敗しました');

      const res = await app.request('/');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ userId: user.id });
    });
  });

  describe('異常系', () => {
    test('clerkIdに紐づくユーザーが存在しない場合は401エラーが返る', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: unauthorizedErrorMessage });
    });
  });
});
