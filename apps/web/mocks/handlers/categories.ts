import {
  getGetApiCategoriesMockHandler,
  getGetApiCategoriesResponseMock,
} from '@/lib/api/generated/categories/categories.msw';
import { CATEGORY_TYPE } from '@repo/common';

const MIN_SAMPLE_CATEGORIES = 6;

export const categoriesHandler = getGetApiCategoriesMockHandler((info) => {
  const url = new URL(info.request.url);
  const typeCode =
    Number(url.searchParams.get('typeCode')) === CATEGORY_TYPE.INCOME
      ? CATEGORY_TYPE.INCOME
      : CATEGORY_TYPE.EXPENSE;

  const withConsistentTypeCode = (
    data: ReturnType<typeof getGetApiCategoriesResponseMock>['categories'][number]
  ) => ({
    ...data,
    typeCode,
    parentId: null,
    children: data.children.map((child) => ({ ...child, typeCode, parentId: data.id })),
  });

  const categories = getGetApiCategoriesResponseMock().categories.map(withConsistentTypeCode);

  while (categories.length < MIN_SAMPLE_CATEGORIES) {
    categories.push(...getGetApiCategoriesResponseMock().categories.map(withConsistentTypeCode));
  }

  return { categories };
});
