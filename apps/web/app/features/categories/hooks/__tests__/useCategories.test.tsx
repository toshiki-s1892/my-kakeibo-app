import { CATEGORY_TYPE } from '@repo/common';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from 'vitest.setup.hooks';
import { createQueryClientWrapper } from 'vitest.utils.hooks';
import { useCategories } from '../useCategories';

describe('useCategories', () => {
  describe('正常系', () => {
    test('typeCode（支出/収入の指定）を渡すと、CATEGORY_TYPEの数値コードに変換されてカテゴリー取得APIが呼ばれる', async () => {
      let capturedTypeCode: string | null = null;
      server.use(
        http.get('*/api/categories', ({ request }) => {
          capturedTypeCode = new URL(request.url).searchParams.get('typeCode');
          return HttpResponse.json([]);
        })
      );

      renderHook(() => useCategories('EXPENSE'), { wrapper: createQueryClientWrapper() });

      await waitFor(() => {
        expect(capturedTypeCode).toBe(String(CATEGORY_TYPE.EXPENSE));
      });
    });
  });

  describe('異常系', () => {
    test('カテゴリー取得APIが失敗すると、errorがセットされる', async () => {
      server.use(
        http.get('*/api/categories', () =>
          HttpResponse.json({ message: 'テスト用エラーメッセージ' }, { status: 500 })
        )
      );

      const { result } = renderHook(() => useCategories('EXPENSE'), {
        wrapper: createQueryClientWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });
});
