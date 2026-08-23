import {
  useDeleteApiCategoriesCategoryIdPin,
  usePutApiCategoriesCategoryIdPin,
} from '@/lib/api/generated/categories/categories';

export const useCategoryPin = () => {
  const pinMutation = usePutApiCategoriesCategoryIdPin();
  const unpinmutation = useDeleteApiCategoriesCategoryIdPin();

  const togglePin = (categoryId: string, isPinned: boolean) => {
    if (isPinned) {
      unpinmutation.mutate({ categoryId });
    } else {
      pinMutation.mutate({ categoryId });
    }
  };
  return { togglePin, isPending: pinMutation.isPending || unpinmutation.isPending };
};
