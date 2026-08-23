import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

type QueryBoundaryProps = {
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
};

export const QueryBoundary = ({
  isPending,
  error,
  onRetry,
  skeleton,
  children,
}: QueryBoundaryProps) => {
  if (isPending) {
    return skeleton;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>読み込みに失敗しました</AlertTitle>
        <AlertDescription>
          <Button variant="outline" size="sm" onClick={onRetry}>
            再試行
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return children;
};
