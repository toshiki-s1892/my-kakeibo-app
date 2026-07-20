import { errorHandler } from '@/server/shared/error-handler';
import { clerkMiddleware } from '@clerk/hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { usersTable } from '@repo/db/schema';
import { Context, Next } from 'hono';

// clerk認証のmock化
const { mockUserId } = vi.hoisted(() => ({
  mockUserId: { current: 'test-user-id' },
}));

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: Context, next: Next) => {
    await next();
  },
  getAuth: () => ({ userId: mockUserId.current }),
}));

describe('profileHandler', () => {
  let app: OpenAPIHono;

  beforeEach(async () => {
    const profileRouter = (await import('@/server/routes/profile')).default;
    app = new OpenAPIHono();
    app.use('/profile/*', clerkMiddleware());
    app.route('/profile', profileRouter);
    app.onError(errorHandler);
  });

  describe('正常系', () => {
    test('有効なリクエストボディを送るとユーザーが作成される', async () => {
      const res = await app.request('/profile/setup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テスト太郎',
          genderCode: 1,
          birthday: '2000-01-01T00:00:00Z',
          regionCode: 13,
        }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      expect(res.status).toBe(204);

      const { db } = await import('@/server/lib/db');
      const users = await db.select().from(usersTable);
      expect(users).toHaveLength(1);
    });
  });

  describe('異常系', () => {
    test('必須項目が欠けたリクエストを送るとバリデーションエラーが返る', async () => {
      const res = await app.request('/profile/setup', {
        method: 'POST',
        body: JSON.stringify({
          // nameを省略
          genderCode: 1,
          birthday: '2000-01-01T00:00:00Z',
          regionCode: 13,
        }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ message: expect.any(String) });
    });

    test('既にセットアップ済みのユーザーが再度送信すると失敗する', async () => {
      // 1回目（成功）
      await app.request('/profile/setup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テスト太郎',
          genderCode: 1,
          birthday: '2000-01-01T00:00:00Z',
          regionCode: 13,
        }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      // 2回目（失敗）
      const res = await app.request('/profile/setup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テスト太郎',
          genderCode: 1,
          birthday: '2000-01-01T00:00:00Z',
          regionCode: 13,
        }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      expect(res.status).toBe(409);

      const { db } = await import('@/server/lib/db');
      const users = await db.select().from(usersTable);
      expect(users).toHaveLength(1); // 1回目の1件だけで、増えていない
    });
  });
});
