export const CATEGORY_TAB = {
  CATEGORIES: 'categories',
  TRANSACTION_PARTIES: 'transactionParties',
} as const;

export const CATEGORY_TABS = [
  { value: CATEGORY_TAB.CATEGORIES, label: 'カテゴリ' },
  { value: CATEGORY_TAB.TRANSACTION_PARTIES, label: '取引先' },
] as const;
