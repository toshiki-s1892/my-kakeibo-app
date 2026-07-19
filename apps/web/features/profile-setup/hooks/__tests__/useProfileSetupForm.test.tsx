import { GENDER_CODE, unexpectedErrorMessage } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { ReactNode } from 'react';
import { server } from 'vitest.setup.hooks';
import { ProfileSetupFormValues } from '../../schema/profileSetupFormSchema';
import { useProfileSetupForm } from '../useProfileSetupForm';

// next/navigationをmock化する
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// テスト用のQueryClientProviderを作る（フック内のusePostApiProfileSetupがTanStack Query依存のため）
const createWrapper = () => {
  // テストごとにQueryClientを作り、通信状態・キャッシュがテスト間で共有されるのを防ぐ
  // Wrapperの外で作ることで再レンダリング時に作り直されない（本番app/providers.tsxのuseStateと同じ目的）
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false, // 失敗時の自動リトライを無効化（異常系テストがリトライ待ちでタイムアウトしないように）
      },
      queries: {
        retry: false, // 失敗時の自動リトライを無効化（異常系テストがリトライ待ちでタイムアウトしないように）
      },
    },
  });

  // TanStack Queryのフックは外側にQueryClientProviderが必要なため、テストでもその環境を作る（本番はapp/providers.tsxが同じ役割）
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

// フォーム値を宣言
const validValues: ProfileSetupFormValues = {
  name: 'テスト太郎',
  gender: 'MALE',
  birthday: new Date('1990-01-01'),
  regionCode: '13',
};

// useProfileSetupFormをrenderし、正常な値でフォームを送信するところまで進める
const submitWithValidValues = async () => {
  const { result } = renderHook(() => useProfileSetupForm(), {
    wrapper: createWrapper(),
  });

  // setValue・onSubmitはフォーム状態（値・エラー・送信中フラグ）を更新するため、actで包んで反映を確定させてから検証する
  await act(async () => {
    result.current.form.setValue('name', validValues.name);
    result.current.form.setValue('gender', validValues.gender);
    result.current.form.setValue('birthday', validValues.birthday);
    result.current.form.setValue('regionCode', validValues.regionCode);
    await result.current.onSubmit();
  });

  return { result };
};

describe('useProfileSetupForm', () => {
  describe('正常系', () => {
    test('204が返るとダッシュボードへ遷移する', async () => {
      await submitWithValidValues();

      // pushはmutationのonSuccessで遅れて呼ばれるため、waitForで待って検証する
      await waitFor(() => {
        expect(push).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('フォーム値が変換されてAPIに送信される', async () => {
      let capturedBody: unknown;
      server.use(
        http.post('*/api/profile/setup', async ({ request }) => {
          capturedBody = await request.json();
          return new HttpResponse(null, { status: 204 });
        })
      );

      await submitWithValidValues();

      await waitFor(() => {
        expect(capturedBody).toEqual({
          name: validValues.name,
          genderCode: GENDER_CODE[validValues.gender],
          birthday: validValues.birthday.toISOString(),
          regionCode: Number(validValues.regionCode),
        });
      });
    });
  });

  describe('異常系', () => {
    test('400が返るとsubmitErrorが設定される', async () => {
      server.use(
        http.post('*/api/profile/setup', () => {
          return HttpResponse.json({ message: 'バリデーションエラー' }, { status: 400 });
        })
      );

      const { result } = await submitWithValidValues();

      await waitFor(() => {
        expect(result.current.submitError).toBe(unexpectedErrorMessage);
      });
    });

    test('204・400以外のステータスが返るとsubmitErrorが設定される', async () => {
      server.use(
        http.post('*/api/profile/setup', () =>
          HttpResponse.json({ message: 'サーバーエラー' }, { status: 500 })
        )
      );

      const { result } = await submitWithValidValues();

      await waitFor(() => {
        expect(result.current.submitError).toBe(unexpectedErrorMessage);
      });
    });

    test('通信エラーが発生するとsubmitErrorにメッセージが設定される', async () => {
      server.use(http.post('*/api/profile/setup', () => HttpResponse.error()));

      const { result } = await submitWithValidValues();

      await waitFor(() => {
        expect(result.current.submitError).toBe(unexpectedErrorMessage);
      });
    });

    test('バリデーションエラー時はAPIが呼ばれずダッシュボードへ遷移しない', async () => {
      const { result } = renderHook(() => useProfileSetupForm(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(push).not.toHaveBeenCalled();
    });
  });
});
