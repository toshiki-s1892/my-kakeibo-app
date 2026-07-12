import { CATEGORY_COLOR_CODE, CATEGORY_ICON_CODE, CATEGORY_TYPE } from '@repo/common';
import { categoriesTable } from '@repo/db';

type DefaultCategory = Omit<typeof categoriesTable.$inferInsert, 'userId'>;

// アカウント作成時に作成するカテゴリ
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // 支出（EXPENSE）
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '食費',
    icon: CATEGORY_ICON_CODE.UTENSILS,
    color: CATEGORY_COLOR_CODE.ORANGE,
    isPinned: true,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '交通費',
    icon: CATEGORY_ICON_CODE.TRAIN,
    color: CATEGORY_COLOR_CODE.CYAN,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '住まいの費用',
    icon: CATEGORY_ICON_CODE.HOME,
    color: CATEGORY_COLOR_CODE.STONE,
    isPinned: true,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '光熱費',
    icon: CATEGORY_ICON_CODE.LIGHTBULB,
    color: CATEGORY_COLOR_CODE.YELLOW,
    isPinned: true,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '通信費',
    icon: CATEGORY_ICON_CODE.SMARTPHONE,
    color: CATEGORY_COLOR_CODE.INDIGO,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '医療費',
    icon: CATEGORY_ICON_CODE.STETHOSCOPE,
    color: CATEGORY_COLOR_CODE.TEAL,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '服・靴',
    icon: CATEGORY_ICON_CODE.SHIRT,
    color: CATEGORY_COLOR_CODE.SLATE,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '日用品費',
    icon: CATEGORY_ICON_CODE.SHOPPING_BASKET,
    color: CATEGORY_COLOR_CODE.GRAY,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '趣味・娯楽',
    icon: CATEGORY_ICON_CODE.GAMEPAD,
    color: CATEGORY_COLOR_CODE.TEAL,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '教育費',
    icon: CATEGORY_ICON_CODE.GRADUATION_CAP,
    color: CATEGORY_COLOR_CODE.INDIGO,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: '保険料',
    icon: CATEGORY_ICON_CODE.SHIELD,
    color: CATEGORY_COLOR_CODE.SLATE,
  },
  {
    typeCode: CATEGORY_TYPE.EXPENSE,
    name: 'その他',
    icon: CATEGORY_ICON_CODE.TAG,
    color: CATEGORY_COLOR_CODE.GRAY,
  },
  // 収入（INCOME）
  {
    typeCode: CATEGORY_TYPE.INCOME,
    name: '給与',
    icon: CATEGORY_ICON_CODE.WALLET,
    color: CATEGORY_COLOR_CODE.YELLOW,
  },
  {
    typeCode: CATEGORY_TYPE.INCOME,
    name: 'ボーナス',
    icon: CATEGORY_ICON_CODE.GIFT,
    color: CATEGORY_COLOR_CODE.ORANGE,
  },
  {
    typeCode: CATEGORY_TYPE.INCOME,
    name: '副業',
    icon: CATEGORY_ICON_CODE.BRIEFCASE,
    color: CATEGORY_COLOR_CODE.INDIGO,
  },
  {
    typeCode: CATEGORY_TYPE.INCOME,
    name: 'その他',
    icon: CATEGORY_ICON_CODE.TAG,
    color: CATEGORY_COLOR_CODE.GRAY,
  },
];
