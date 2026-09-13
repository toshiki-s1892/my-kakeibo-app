import { UserEnv } from '@/server/lib/auth';
import { errorHandler } from '@/server/shared/error-handler';
import { clerkMiddleware } from '@clerk/hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  CATEGORY_COLOR_CODE,
  CATEGORY_ICON_CODE,
  CATEGORY_TYPE,
  categoryPinTargetInvalidMessage,
  lastPinnedCategoryMessage,
} from '@repo/common';
import { categoriesTable, usersTable } from '@repo/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
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

describe('categoryPinHandler', () => {
  let app: OpenAPIHono<UserEnv>;
  let testUserId: string;

  // clerkIdを指定してテストユーザーを1件作成する
  const insertUser = async (clerkId: string) => {
    const { db } = await import('@/server/lib/db');
    const [user] = await db
      .insert(usersTable)
      .values({ clerk_id: clerkId, regionCode: 13 })
      .returning();

    if (!user) throw new Error('テストユーザーの作成に失敗しました。');

    return user;
  };

  // ピン留め可能な支出カテゴリーを基準値とし、overridesで上書きして1件作成する
  const insertCategory = async (overrides: Partial<typeof categoriesTable.$inferInsert> = {}) => {
    const { db } = await import('@/server/lib/db');
    const [category] = await db
      .insert(categoriesTable)
      .values({
        userId: testUserId,
        typeCode: CATEGORY_TYPE.EXPENSE,
        name: '食費',
        icon: CATEGORY_ICON_CODE.BRIEFCASE,
        color: CATEGORY_COLOR_CODE.CYAN,
        parentId: null,
        isPinned: false,
        ...overrides,
      })
      .returning();

    if (!category) throw new Error('テストカテゴリーの作成に失敗しました。');

    return category;
  };

  // categoryIdのカテゴリーを取得する
  const findCategory = async (categoryId: string) => {
    const { db } = await import('@/server/lib/db');
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId));

    if (!category) throw new Error('テストカテゴリーの取得に失敗しました。');

    return category;
  };

  beforeEach(async () => {
    const { authMiddleware, requireUserMiddleware } = await import('@/server/lib/auth');
    const categoriesRouter = (await import('@/server/routes/categories')).default;
    app = new OpenAPIHono<UserEnv>();
    app.use('/categories/*', clerkMiddleware(), authMiddleware, requireUserMiddleware);
    app.route('/categories', categoriesRouter);
    app.onError(errorHandler);

    const user = await insertUser(mockClerkId.current);
    testUserId = user.id;
  });

  describe('putCategoryPinHandler', () => {
    describe('正常系', () => {
      test('有効なカテゴリーIDを指定するとカテゴリをピン留めされる', async () => {
        const category = await insertCategory();

        const res = await app.request(`/categories/${category.id}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(204);

        const updatedCategory = await findCategory(category.id);
        expect(updatedCategory.isPinned).toBe(true);
      });
    });

    describe('異常系', () => {
      test('存在しないカテゴリーIDをピン留めしようとした場合、404エラーを返す', async () => {
        const noExistCategoryId = randomUUID();
        const res = await app.request(`/categories/${noExistCategoryId}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(404);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });
      });

      test('他ユーザーのカテゴリーIDをピン留めしようとした場合、404エラーを返す', async () => {
        const otherUser = await insertUser('other-clerk-id');
        const otherUserCategory = await insertCategory({ userId: otherUser.id });

        const res = await app.request(`/categories/${otherUserCategory.id}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(404);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(otherUserCategory.id);
        expect(unchangedCategory.isPinned).toBe(false);
      });

      test('子カテゴリーをピン留めしようとした場合、400エラーを返す', async () => {
        const parentCategory = await insertCategory({ name: '食費' });
        const childCategory = await insertCategory({
          name: '外食',
          parentId: parentCategory.id,
        });

        const res = await app.request(`/categories/${childCategory.id}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(childCategory.id);
        expect(unchangedCategory.isPinned).toBe(false);
      });

      test('収入カテゴリーをピン留めしようとした場合、400エラーを返す', async () => {
        const incomeCategory = await insertCategory({
          typeCode: CATEGORY_TYPE.INCOME,
        });

        const res = await app.request(`/categories/${incomeCategory.id}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(incomeCategory.id);
        expect(unchangedCategory.isPinned).toBe(false);
      });

      test('削除済みカテゴリーをピン留めしようとした場合、400エラーを返す', async () => {
        const deletedCategory = await insertCategory({ deletedAt: new Date() });

        const res = await app.request(`/categories/${deletedCategory.id}/pin`, {
          method: 'PUT',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(deletedCategory.id);
        expect(unchangedCategory.isPinned).toBe(false);
      });
    });
  });

  describe('deleteCategoryPinHandler', () => {
    describe('正常系', () => {
      test('有効なカテゴリーIDを指定するとカテゴリをピン留め解除される', async () => {
        await insertCategory({ name: '光熱費', isPinned: true });
        const targetCategory = await insertCategory({ name: '食費', isPinned: true });

        const res = await app.request(`/categories/${targetCategory.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(204);

        const updatedCategory = await findCategory(targetCategory.id);
        expect(updatedCategory.isPinned).toBe(false);
      });
    });

    describe('異常系', () => {
      test('存在しないカテゴリーIDをピン留め解除しようとした場合、404エラーを返す', async () => {
        const noExistCategoryId = randomUUID();
        const res = await app.request(`/categories/${noExistCategoryId}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(404);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });
      });

      test('他ユーザーのカテゴリーIDをピン留め解除しようとした場合、404エラーを返す', async () => {
        const otherUser = await insertUser('other-clerk-id');
        const otherUserCategory = await insertCategory({ userId: otherUser.id, isPinned: true });

        const res = await app.request(`/categories/${otherUserCategory.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(404);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(otherUserCategory.id);
        expect(unchangedCategory.isPinned).toBe(true);
      });

      test('子カテゴリーをピン留め解除しようとした場合、400エラーを返す', async () => {
        const parentCategory = await insertCategory({ name: '食費' });
        const childCategory = await insertCategory({
          name: '外食',
          parentId: parentCategory.id,
          isPinned: true,
        });

        const res = await app.request(`/categories/${childCategory.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(childCategory.id);
        expect(unchangedCategory.isPinned).toBe(true);
      });

      test('収入カテゴリーをピン留め解除しようとした場合、400エラーを返す', async () => {
        const incomeCategory = await insertCategory({
          typeCode: CATEGORY_TYPE.INCOME,
          isPinned: true,
        });

        const res = await app.request(`/categories/${incomeCategory.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(incomeCategory.id);
        expect(unchangedCategory.isPinned).toBe(true);
      });

      test('削除済みカテゴリーをピン留め解除しようとした場合、400エラーを返す', async () => {
        const deletedCategory = await insertCategory({
          isPinned: true,
          deletedAt: new Date(),
        });

        const res = await app.request(`/categories/${deletedCategory.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: categoryPinTargetInvalidMessage });

        const unchangedCategory = await findCategory(deletedCategory.id);
        expect(unchangedCategory.isPinned).toBe(true);
      });

      test('最後の1件のピン留めカテゴリを解除しようとした場合、400エラーを返す', async () => {
        const category = await insertCategory({ isPinned: true });

        const res = await app.request(`/categories/${category.id}/pin`, {
          method: 'DELETE',
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ message: lastPinnedCategoryMessage });

        const unchangedCategory = await findCategory(category.id);
        expect(unchangedCategory.isPinned).toBe(true);
      });
    });
  });
});
