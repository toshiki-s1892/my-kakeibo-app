import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleAlertIcon } from 'lucide-react';
import { ReactNode } from 'react';

type QueryBoundaryProps = {
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  loading: ReactNode;
  children: ReactNode;
};

export const QueryBoundary = ({
  isPending,
  error,
  onRetry,
  loading,
  children,
}: QueryBoundaryProps) => {
  if (isPending) {
    return loading;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CircleAlertIcon className="static translate-y-0" />
          <AlertTitle>読み込みに失敗しました</AlertTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-destructive text-destructive hover:bg-destructive/10 bg-white font-bold"
        >
          再試行
        </Button>
      </Alert>
    );
  }

  return children;
};
