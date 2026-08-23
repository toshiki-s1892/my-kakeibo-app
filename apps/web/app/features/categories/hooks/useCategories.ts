import { useGetApiCategories } from '@/lib/api/generated/categories/categories';
import { CATEGORY_TYPE, CategoryTypeValue } from '@repo/common';

export const useCategories = (typeCode: CategoryTypeValue, options?: { enabled?: boolean }) => {
  return useGetApiCategories({ typeCode: CATEGORY_TYPE[typeCode] }, { query: options });
};
