import { QueryBoundary } from '@/components/QueryBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '../hooks/useCategories';
import { useCategoryPin } from '../hooks/useCategoryPin';
import { CategoryRow } from './CategoryRow';

type CategoryTableProps = {
  categories: ReturnType<typeof useCategories>;
  categoryPin: ReturnType<typeof useCategoryPin>;
};

export const CategoryTable = ({ categories, categoryPin }: CategoryTableProps) => {
  return (
    <QueryBoundary
      isPending={categories.isPending}
      error={categories.error}
      onRetry={() => categories.refetch()}
      skeleton={<Skeleton className="h-14 w-full" />}
    >
      <ul className="border-border rounded-md border-2 p-4">
        {categories.data?.categories.map((category) => (
          <CategoryRow key={category.id} category={category} categoryPin={categoryPin} />
        ))}
      </ul>
    </QueryBoundary>
  );
};
