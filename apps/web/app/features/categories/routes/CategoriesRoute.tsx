'use client';
import { AddButton } from '@/components/AddButton';
import { CATEGORY_TYPE_VALUE, CategoryTypeValue } from '@repo/common';
import { useState } from 'react';
import { CATEGORY_TAB } from '../categoryTab';
import { CategoryTable } from '../components/CategoryTable';
import { CategoryTransactionPartyTabs } from '../components/CategoryTransactionPartyTabs';
import { IncomeExpenseTabs } from '../components/IncomeExpenseTabs';
import { useCategories } from '../hooks/useCategories';
import { useCategoryPin } from '../hooks/useCategoryPin';

export const CategoriesRoute = () => {
  const [categoryTab, setCategoryTab] = useState<string>(CATEGORY_TAB.CATEGORIES);
  const [categoryType, setCategoryType] = useState<CategoryTypeValue>(CATEGORY_TYPE_VALUE.EXPENSE);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 新規カテゴリー追加Dialog実装までの一時対応
  const [opencreateModal, setOpenCreateModal] = useState<boolean>(false);

  // カテゴリーデータの取得
  const categories = useCategories(categoryType, {
    enabled: categoryTab === CATEGORY_TAB.CATEGORIES,
  });

  // カテゴリーピン設定切り替え
  const categoryPin = useCategoryPin();

  return (
    <div className="flex min-h-screen w-full min-w-screen flex-col gap-4 px-4 md:px-16">
      {/* カテゴリー/取引先切り替えタブ */}
      <CategoryTransactionPartyTabs value={categoryTab} onValueChange={setCategoryTab} />
      {/* 支出/収支切り替えタブ */}
      <IncomeExpenseTabs
        value={categoryType}
        onValueChange={setCategoryType}
        addButton={<AddButton className="h-8" onClick={() => setOpenCreateModal(true)} />}
      />
      {/* SP版: PC版の行内には表示されないため別途表示 */}
      <AddButton
        className="text-primary-300 border-border h-10 w-full border-2 bg-white md:hidden"
        onClick={() => setOpenCreateModal(true)}
      />
      {/* 各タブのリスト表示を記載する */}

      {categories.isPending && <p>Loading...</p>}
      {categories.error && <p>Error: {categories.error.message}</p>}

      <CategoryTable categories={categories} categoryPin={categoryPin} />
    </div>
  );
};
