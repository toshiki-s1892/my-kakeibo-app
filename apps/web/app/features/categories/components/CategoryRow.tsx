import { CategoryIcon } from '@/components/CategoryIcon';
import { cn } from '@/components/lib/utils';
import { CategoryWithChildren } from '@/lib/api/generated/models';
import { CATEGORY_COLOR_CLASS } from '@/lib/category/categoryColor';
import { CATEGORY_ICON_COMPONENT } from '@/lib/category/categoryIcon';
import EditIcon from '@/public/icon/edit.svg';
import PinIcon from '@/public/icon/pin.svg';
import PinFilledIcon from '@/public/icon/pinFill.svg';
import { CATEGORY_TYPE } from '@repo/common';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useCategoryPin } from '../hooks/useCategoryPin';

type CategoryRowProps = {
  category: CategoryWithChildren;
  categoryPin: ReturnType<typeof useCategoryPin>;
};

export const CategoryRow = ({ category, categoryPin }: CategoryRowProps) => {
  const [isChildrenExpanded, setIsChildrenExpanded] = useState<boolean>(true);
  const Icon = CATEGORY_ICON_COMPONENT[category.icon];
  const PinIconComponent = category.isPinned ? PinFilledIcon : PinIcon;

  return (
    <li key={category.id} className="border-border border-b">
      <div className="flex w-full items-center gap-2 py-2">
        {/* 子カテゴリ表示/非表示切り替えトグル */}
        <ChevronRight
          className={cn(
            'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isChildrenExpanded && 'rotate-90',
            category.children && category.children.length > 0 ? 'visible' : 'invisible'
          )}
          onClick={() => setIsChildrenExpanded(!isChildrenExpanded)}
        />

        {/* カテゴリーアイコン */}
        <CategoryIcon icon={Icon} className={CATEGORY_COLOR_CLASS[category.color]} />
        <span>{category.name}</span>
        {/* カテゴリー編集アイコン */}
        <EditIcon />

        {/* カテゴリーピン留め切り替えアイコン（支出のみ） */}
        {category.typeCode === CATEGORY_TYPE.EXPENSE && (
          <PinIconComponent
            className={cn(
              'ml-auto',
              categoryPin.isPending ? 'pointer-events-none opacity-50' : 'cursor-pointer'
            )}
            onClick={() => categoryPin.togglePin(category.id, !category.isPinned)}
          />
        )}
      </div>

      {/* 子カテゴリー */}
      {category.children && category.children.length > 0 && isChildrenExpanded && (
        <ul className="ml-5">
          {category.children.map((childCategory, index, children) => {
            const ChildIcon = CATEGORY_ICON_COMPONENT[childCategory.icon];
            const isLastChild = index === children.length - 1;

            return (
              <li
                key={childCategory.id}
                className={cn(
                  'relative flex items-center gap-2 py-2 pl-6',
                  "before:border-muted-foreground before:absolute before:top-0 before:left-0 before:w-4 before:border-l before:content-['']",
                  "after:border-muted-foreground after:absolute after:top-1/2 after:left-0 after:w-4 after:border-t after:content-['']",
                  isLastChild ? 'before:h-1/2' : 'before:h-full'
                )}
              >
                <CategoryIcon
                  icon={ChildIcon}
                  className={CATEGORY_COLOR_CLASS[childCategory.color]}
                />
                <span>{childCategory.name}</span>
                <EditIcon />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};
