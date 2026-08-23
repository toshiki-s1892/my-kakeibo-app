import { renderHook, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { server } from 'vitest.setup.hooks';
import { createQueryClientWrapper } from 'vitest.utils.hooks';
import { useCategoryPin } from '../useCategoryPin';

describe('useCategoryPin', () => {
  describe('正常系', () => {
    test('isPinnedがfalseのとき、ピン留めするPUTが呼ばれる', async () => {
      let calledPut = false;

      server.use(
        http.put('*/api/categories/:categoryId/pin', () => {
          calledPut = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useCategoryPin(), {
        wrapper: createQueryClientWrapper(),
      });

      result.current.togglePin('categoryId', false);

      await waitFor(() => {
        expect(calledPut).toBe(true);
      });
    });

    test('isPinnedがtrueのとき、ピン留めを解除するDELETEが呼ばれる', async () => {
      let calledDelete = false;

      server.use(
        http.delete('*/api/categories/:categoryId/pin', () => {
          calledDelete = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useCategoryPin(), {
        wrapper: createQueryClientWrapper(),
      });

      result.current.togglePin('categoryId', true);

      await waitFor(() => {
        expect(calledDelete).toBe(true);
      });
    });

    test('isPinnedがfalseでAPI実行中は、isPendingがtrueになる', async () => {
      server.use(
        http.put('*/api/categories/:categoryId/pin', async () => {
          await delay(50);
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useCategoryPin(), {
        wrapper: createQueryClientWrapper(),
      });

      result.current.togglePin('categoryId', false);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });
    });

    test('isPinnedがtrueでAPI実行中は、isPendingがtrueになる', async () => {
      server.use(
        http.delete('*/api/categories/:categoryId/pin', async () => {
          await delay(50);
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useCategoryPin(), {
        wrapper: createQueryClientWrapper(),
      });

      result.current.togglePin('categoryId', true);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });
    });
  });
});
