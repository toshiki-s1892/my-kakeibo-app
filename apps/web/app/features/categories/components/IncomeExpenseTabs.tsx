import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_TYPE_OPTIONS, CATEGORY_TYPE_VALUE, CategoryTypeValue } from '@repo/common';
import type { ReactNode } from 'react';

type IncomeExpenseTabsProps = {
  value: string;
  onValueChange: (value: CategoryTypeValue) => void;
  addButton?: ReactNode;
};

export const IncomeExpenseTabs = ({ value, onValueChange, addButton }: IncomeExpenseTabsProps) => {
  return (
    <Tabs
      value={value}
      onValueChange={(value) => {
        if (value === CATEGORY_TYPE_VALUE.EXPENSE || value === CATEGORY_TYPE_VALUE.INCOME) {
          onValueChange(value);
        }
      }}
    >
      {/* PC版: タブと追加ボタンを同じ行に並べ、下線は行全体に伸ばす */}
      <div className="border-border hidden items-start justify-between border-b md:flex">
        <TabsList variant="line">
          {CATEGORY_TYPE_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="after:bg-primary-300 text-base group-data-[orientation=horizontal]/tabs:after:h-1"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {addButton}
      </div>

      {/* SP版 */}
      <TabsList variant="default" className="bg-tab-track w-full rounded-2xl md:hidden">
        {CATEGORY_TYPE_OPTIONS.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="data-[state=active]:bg-primary-300 data-[state=active]:text-primary-foreground rounded-2xl"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
