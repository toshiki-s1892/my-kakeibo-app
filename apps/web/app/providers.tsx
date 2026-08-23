'use client';
import '@/lib/zod-locale';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';

export const Provider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [mockingReady, setMockingReady] = useState(
    process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled'
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return;
    import('@/mocks/browser').then(({ worker }) =>
      worker.start().then(() => setMockingReady(true))
    );
  }, []);

  if (!mockingReady) return null;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
