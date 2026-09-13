import { ApiError } from '@/lib/api/api-error';
import {
  getGetApiCategoriesQueryKey,
  useDeleteApiCategoriesCategoryIdPin,
  usePutApiCategoriesCategoryIdPin,
} from '@/lib/api/generated/categories/categories';
import { useQueryClient } from '@tanstack/react-query';
import { unexpectedErrorMessage } from '@repo/common';
import { toast } from 'sonner';

export const useCategoryPin = () => {
  const queryClient = useQueryClient();

  // ピン留め・解除の成否によらず一覧の表示に影響するため、typeCode別のキャッシュをまとめて再取得する
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiCategoriesQueryKey() });
  };

  const onError = (error: ApiError | Error) => {
    const message =
      error instanceof ApiError
        ? (error.body?.message ?? unexpectedErrorMessage)
        : unexpectedErrorMessage;
    toast.error(message);
  };

  const pinMutation = usePutApiCategoriesCategoryIdPin({ mutation: { onSuccess, onError } });
  const unpinMutation = useDeleteApiCategoriesCategoryIdPin({ mutation: { onSuccess, onError } });

  const togglePin = (categoryId: string, isPinned: boolean) => {
    if (isPinned) {
      unpinMutation.mutate({ categoryId });
    } else {
      pinMutation.mutate({ categoryId });
    }
  };
  return { togglePin, isPending: pinMutation.isPending || unpinMutation.isPending };
};
