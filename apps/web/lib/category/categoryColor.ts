import { CATEGORY_COLOR_CODE, type CategoryColorCode } from '@repo/common';

export const CATEGORY_COLOR_CLASS: Record<CategoryColorCode, string> = {
  [CATEGORY_COLOR_CODE.ORANGE]: 'bg-orange-100 text-orange-700',
  [CATEGORY_COLOR_CODE.YELLOW]: 'bg-yellow-100 text-yellow-700',
  [CATEGORY_COLOR_CODE.TEAL]: 'bg-teal-100 text-teal-700',
  [CATEGORY_COLOR_CODE.CYAN]: 'bg-cyan-100 text-cyan-700',
  [CATEGORY_COLOR_CODE.INDIGO]: 'bg-indigo-100 text-indigo-700',
  [CATEGORY_COLOR_CODE.ROSE]: 'bg-rose-100 text-rose-700',
  [CATEGORY_COLOR_CODE.VIOLET]: 'bg-violet-100 text-violet-700',
  [CATEGORY_COLOR_CODE.EMERALD]: 'bg-emerald-100 text-emerald-700',
};
