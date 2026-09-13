import { CategoryWithChildren } from '@/lib/api/generated/models';
import { useCategoryPin } from '../hooks/useCategoryPin';
import { CategoryRow } from './CategoryRow';

type CategoryTableProps = {
  categories: CategoryWithChildren[];
  categoryPin: ReturnType<typeof useCategoryPin>;
};

export const CategoryTable = ({ categories, categoryPin }: CategoryTableProps) => {
  return (
    <ul className="border-border rounded-md border-2 p-4">
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} categoryPin={categoryPin} />
      ))}
    </ul>
  );
};
