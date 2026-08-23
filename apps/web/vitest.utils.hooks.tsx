import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// hooksプロジェクトのテストで共通のQueryClientProviderラッパーを作る（本番app/providers.tsxと同じ役割）
export const createQueryClientWrapper = () => {
  // テストごとにQueryClientを作り、通信状態・キャッシュがテスト間で共有されるのを防ぐ
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 失敗時の自動リトライを無効化（異常系テストがリトライ待ちでタイムアウトしないように）
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};
