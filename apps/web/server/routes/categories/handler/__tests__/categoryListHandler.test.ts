import { UserEnv } from '@/server/lib/auth';
import { errorHandler } from '@/server/shared/error-handler';
import { clerkMiddleware } from '@clerk/hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { CATEGORY_COLOR_CODE, CATEGORY_ICON_CODE, CATEGORY_TYPE } from '@repo/common';
import { categoriesTable, usersTable } from '@repo/db/schema';
import { Context, Next } from 'hono';

// clerk認証のmock化
const { mockClerkId } = vi.hoisted(() => ({
  mockClerkId: { current: 'test-clerk-id' },
}));

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: Context, next: Next) => {
    await next();
  },
  getAuth: () => ({
    userId: mockClerkId.current,
  }),
}));

describe('categoryListHandler', () => {
  let app: OpenAPIHono<UserEnv>;
  let testUserId: string;

  beforeEach(async () => {
    const { authMiddleware, requireUserMiddleware } = await import('@/server/lib/auth');
    const categoriesRouter = (await import('@/server/routes/categories')).default;
    app = new OpenAPIHono<UserEnv>();
    app.use('/categories/*', clerkMiddleware(), authMiddleware, requireUserMiddleware);
    app.route('/categories', categoriesRouter);
    app.onError(errorHandler);

    const { db } = await import('@/server/lib/db');
    const [user] = await db
      .insert(usersTable)
      .values({
        clerk_id: mockClerkId.current,
        regionCode: 13,
      })
      .returning({ id: usersTable.id });

    if (!user) throw new Error('テストユーザーの作成に失敗しました');

    testUserId = user.id;
  });

  describe('正常系', () => {
    test('支出カテゴリー一覧を取得できる', async () => {
      const { db } = await import('@/server/lib/db');
      const inserted = await db
        .insert(categoriesTable)
        .values([
          {
            userId: testUserId,
            typeCode: CATEGORY_TYPE.EXPENSE,
            name: '食費',
            icon: CATEGORY_ICON_CODE.BRIEFCASE,
            color: CATEGORY_COLOR_CODE.CYAN,
            parentId: null,
            isPinned: true,
          },
          {
            userId: testUserId,
            typeCode: CATEGORY_TYPE.EXPENSE,
            name: '交通費',
            icon: CATEGORY_ICON_CODE.BRIEFCASE,
            color: CATEGORY_COLOR_CODE.EMERALD,
            parentId: null,
            isPinned: true,
          },
        ])
        .returning();

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.categories).toHaveLength(2);
      expect(body.categories).toEqual(
        expect.arrayContaining(
          inserted.map((row) =>
            expect.objectContaining({
              id: row.id,
              typeCode: row.typeCode,
              name: row.name,
              icon: row.icon,
              color: row.color,
              isPinned: row.isPinned,
              parentId: row.parentId,
              children: [],
            })
          )
        )
      );
    });

    test('収支カテゴリー一覧を取得できる', async () => {
      const { db } = await import('@/server/lib/db');
      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.INCOME,
          name: '給与',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: false,
        },
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.INCOME,
          name: 'ボーナス',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.EMERALD,
          parentId: null,
          isPinned: false,
        },
      ]);

      const res = await app.request('/categories?typeCode=2', { method: 'GET' });
      expect(res.status).toBe(200);
    });

    test('typeCodeで指定した種別以外のカテゴリーは取得されない', async () => {
      const { db } = await import('@/server/lib/db');
      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '食費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.INCOME,
          name: '給与',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
      ]);

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories.length).toBe(1);
      expect(body.categories[0].name).toBe('食費');
    });

    test('ピン留めされたカテゴリーが先頭にくる', async () => {
      const { db } = await import('@/server/lib/db');
      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '食費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: false,
        },
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '交通費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.EMERALD,
          parentId: null,
          isPinned: true,
        },
      ]);

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories[0].name).toBe('交通費');
    });

    test('同じピン留め状態のカテゴリーは作成日時が新しい順番になる', async () => {
      const { db } = await import('@/server/lib/db');
      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '食費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '交通費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.EMERALD,
          parentId: null,
          isPinned: true,
        },
      ]);

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories[0].name).toBe('交通費');
    });

    test('子カテゴリーがある場合は、親カテゴリーのchildren項目に子カテゴリーが格納される', async () => {
      const { db } = await import('@/server/lib/db');
      const [parentCategory] = await db
        .insert(categoriesTable)
        .values([
          {
            userId: testUserId,
            typeCode: CATEGORY_TYPE.EXPENSE,
            name: '食費',
            icon: CATEGORY_ICON_CODE.BRIEFCASE,
            color: CATEGORY_COLOR_CODE.CYAN,
            parentId: null,
            isPinned: true,
          },
        ])
        .returning({ id: categoriesTable.id });

      if (!parentCategory) throw new Error('親カテゴリーの作成に失敗しました。');

      const [inserted] = await db
        .insert(categoriesTable)
        .values([
          {
            userId: testUserId,
            typeCode: CATEGORY_TYPE.EXPENSE,
            name: '外食',
            icon: CATEGORY_ICON_CODE.BRIEFCASE,
            color: CATEGORY_COLOR_CODE.CYAN,
            parentId: parentCategory.id,
          },
        ])
        .returning();

      if (!inserted) throw new Error('子カテゴリーの作成に失敗しました。');

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories.length).toBe(1);
      expect(body.categories[0].children.length).toBe(1);
      expect(body.categories[0].children[0].name).toBe('外食');
      expect(body.categories[0].children).toEqual([
        {
          id: inserted.id,
          typeCode: inserted.typeCode,
          name: inserted.name,
          icon: inserted.icon,
          color: inserted.color,
          parentId: inserted.parentId,
        },
      ]);
    });

    test('削除済みのカテゴリーは取得されない', async () => {
      const { db } = await import('@/server/lib/db');
      await db.insert(categoriesTable).values([
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '食費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
          deletedAt: new Date(),
        },
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '交通費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
      ]);

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories.length).toBe(1);
      expect(body.categories[0].name).toBe('交通費');
    });

    test('カテゴリーが存在しない場合は空配列が返る', async () => {
      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();

      expect(body.categories).toEqual([]);
    });

    test('他ユーザーのカテゴリーは取得されない', async () => {
      const { db } = await import('@/server/lib/db');
      const [otherUser] = await db
        .insert(usersTable)
        .values({ clerk_id: 'other-clerk-id', regionCode: 13 })
        .returning({ id: usersTable.id });

      if (!otherUser) throw new Error('別ユーザーの作成に失敗しました');

      await db.insert(categoriesTable).values([
        {
          userId: otherUser.id,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '食費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
        {
          userId: testUserId,
          typeCode: CATEGORY_TYPE.EXPENSE,
          name: '交通費',
          icon: CATEGORY_ICON_CODE.BRIEFCASE,
          color: CATEGORY_COLOR_CODE.CYAN,
          parentId: null,
          isPinned: true,
        },
      ]);

      const res = await app.request('/categories?typeCode=1', { method: 'GET' });
      const body = await res.json();
      expect(body.categories.length).toBe(1);
      expect(body.categories[0].name).toBe('交通費');
    });
  });

  describe('異常系', () => {
    test('typeCodeが未指定の場合は400エラーが返る', async () => {
      const res = await app.request('/categories', { method: 'GET' });
      expect(res.status).toBe(400);
    });

    test('typeCodeが不正の値の場合は400エラーが返る', async () => {
      const res = await app.request('/categories?typeCode=3', { method: 'GET' });
      expect(res.status).toBe(400);
    });
  });
});
