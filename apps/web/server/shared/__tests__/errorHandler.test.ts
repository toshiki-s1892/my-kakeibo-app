import { ForeignResourceAccessError } from '@/server/shared/error/customErrors';
import { createTestApp } from '@/server/test-utils/createTestApp';
import { unexpectedErrorMessage } from '@repo/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

// clerk認証のmock化
const { mockClerkId, mockGetAuthThrows } = vi.hoisted(() => ({
  mockClerkId: { current: 'test-clerk-id' },
  mockGetAuthThrows: { current: false },
}));

vi.mock('@clerk/hono', () => ({
  // clerkMiddlewareが未適用のルートでは、本物のgetAuthと同じく例外を投げる
  getAuth: () => {
    if (mockGetAuthThrows.current) {
      throw new Error('clerkMiddlewareが適用されていないため、getAuthの取得に失敗しました');
    }
    return { userId: mockClerkId.current };
  },
}));

describe('errorHandler', () => {
  // console.error/warnの呼び出しから対象メッセージのログ行を取り出す
  const findLogByMessage = (spy: { mock: { calls: unknown[][] } }, message: string) => {
    const log = spy.mock.calls
      .map(([payload]) => JSON.parse(payload as string))
      .find((entry) => entry.message === message);
    if (!log) throw new Error(`ログが見つかりませんでした: ${message}`);
    return log;
  };

  afterEach(() => {
    mockGetAuthThrows.current = false;
  });

  describe('異常系', () => {
    test('DrizzleQueryErrorの場合、paramsの値・message・stackがログに出ない', async () => {
      const app = createTestApp();
      app.get('/error', () => {
        throw new DrizzleQueryError(
          'INSERT INTO users (secret) VALUES (?)',
          ['secretParamValue'],
          new Error('UNIQUE constraint failed: users.clerk_id')
        );
      });

      const spy = vi.spyOn(console, 'error');
      const res = await app.request('/error');

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: unexpectedErrorMessage });

      const log = findLogByMessage(spy, 'DBクエリ失敗');
      expect(log).toMatchObject({
        query: 'INSERT INTO users (secret) VALUES (?)',
        causeMessage: 'UNIQUE constraint failed: users.clerk_id',
        clerkId: mockClerkId.current,
      });
      expect(JSON.stringify(log)).not.toContain('secretParamValue');
      expect(log).not.toHaveProperty('stack');
      expect(log).not.toHaveProperty('errorMessage');
    });

    test('DrizzleQueryError以外のErrorの場合、messageとstackがログに出る', async () => {
      const app = createTestApp();
      app.get('/error', () => {
        throw new Error('unexpected failure');
      });

      const spy = vi.spyOn(console, 'error');
      const res = await app.request('/error');

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: unexpectedErrorMessage });

      const log = findLogByMessage(spy, '想定外エラー');
      expect(log).toMatchObject({
        errorMessage: 'unexpected failure',
        clerkId: mockClerkId.current,
      });
      expect(typeof log.stack).toBe('string');
    });

    test('getAuthが例外を投げる場合も、想定外エラーのログは残り500が返る（clerkIdは出ない）', async () => {
      mockGetAuthThrows.current = true;
      const app = createTestApp();
      app.get('/error', () => {
        throw new Error('unexpected failure');
      });

      const spy = vi.spyOn(console, 'error');
      const res = await app.request('/error');

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: unexpectedErrorMessage });

      const log = findLogByMessage(spy, '想定外エラー');
      expect(log).toMatchObject({ errorMessage: 'unexpected failure' });
      expect(log).not.toHaveProperty('clerkId');
    });

    test('causeがForeignResourceAccessErrorのHTTPExceptionの場合、eventとclerkId付きのwarnが出る', async () => {
      const app = createTestApp();
      app.get('/error', () => {
        throw new HTTPException(404, {
          message: 'not found',
          cause: new ForeignResourceAccessError(),
        });
      });

      const spy = vi.spyOn(console, 'warn');
      const res = await app.request('/error');

      expect(res.status).toBe(404);

      const log = findLogByMessage(spy, 'IDOR試行の疑い');
      expect(log).toMatchObject({
        event: 'malicious_direct_reference',
        clerkId: mockClerkId.current,
      });
    });

    test('causeがForeignResourceAccessErrorでないHTTPExceptionの場合、IDOR試行の疑いのwarnは出ない', async () => {
      const app = createTestApp();
      app.get('/error', () => {
        throw new HTTPException(404, { message: 'not found' });
      });

      const spy = vi.spyOn(console, 'warn');
      const res = await app.request('/error');

      expect(res.status).toBe(404);

      const logs = spy.mock.calls.map(([payload]) => JSON.parse(payload as string));
      expect(logs.some((entry: { message: string }) => entry.message === 'IDOR試行の疑い')).toBe(
        false
      );
    });
  });
});
